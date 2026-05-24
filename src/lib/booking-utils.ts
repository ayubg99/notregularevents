import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { sendRoomContactEmail, sendBookingRefundEmail } from '@/lib/email'
import type { Database, HousingPartnerRow, PartnerRoomRow, RoomContactDbRow } from '@/types/database'

type AdminClient = ReturnType<typeof getAdminClient>

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type BookingWithJoins = RoomContactDbRow & {
  partner_rooms:    PartnerRoomRow | null
  housing_partners: HousingPartnerRow | null
}

export async function fetchBookingByRef(
  ref: string,
  admin: AdminClient,
): Promise<BookingWithJoins | null> {
  const { data } = await admin
    .from('room_contacts')
    .select('*, partner_rooms(*), housing_partners(*)')
    .eq('booking_ref', ref)
    .single() as unknown as { data: BookingWithJoins | null }
  return data
}

export async function confirmBooking(
  ref: string,
  admin?: AdminClient,
): Promise<{ success: boolean; error?: string }> {
  const db = admin ?? getAdminClient()

  const booking = await fetchBookingByRef(ref, db)
  if (!booking) return { success: false, error: 'Booking not found' }
  if (booking.status !== 'pending') return { success: false, error: `Already ${booking.status}` }

  const { error: updateErr } = await db
    .from('room_contacts')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('booking_ref', ref)

  if (updateErr) return { success: false, error: updateErr.message }

  // Count this as a sold contact now that it's confirmed
  await db.rpc('increment_contacts_sold', { p_room_id: booking.room_id! })

  const partner = booking.housing_partners
  if (partner) {
    await sendRoomContactEmail({
      to:                 booking.guest_email,
      guestName:          booking.guest_name,
      roomTitle:          booking.partner_rooms?.title ?? '',
      neighborhood:       booking.partner_rooms?.neighborhood ?? '',
      partnerName:        partner.name,
      partnerWhatsapp:    partner.whatsapp ?? '',
      partnerEmail:       partner.contact_email,
      partnerPhone:       partner.contact_phone ?? '',
      partnerContactName: partner.contact_name,
      moveInDate:         booking.move_in_date ?? '',
      duration:           String(booking.duration_months),
      bookingRef:         ref,
    })
  }

  return { success: true }
}

export async function rejectBooking(
  ref: string,
  reason: string,
  admin?: AdminClient,
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const db = admin ?? getAdminClient()

  const booking = await fetchBookingByRef(ref, db)
  if (!booking) return { success: false, error: 'Booking not found' }
  if (booking.status !== 'pending') return { success: false, error: `Already ${booking.status}` }
  if (!booking.stripe_payment_id) return { success: false, error: 'No payment ID on booking' }

  let refundId: string | undefined

  try {
    const session = await stripe.checkout.sessions.retrieve(booking.stripe_payment_id)
    if (session.payment_intent) {
      const refund = await stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        reason:         'requested_by_customer',
      })
      refundId = refund.id
    }
  } catch (err) {
    console.error('[booking-utils rejectBooking] stripe refund failed:', err)
    return { success: false, error: 'Stripe refund failed' }
  }

  await db
    .from('room_contacts')
    .update({
      status:           'refunded',
      rejected_at:      new Date().toISOString(),
      refund_id:        refundId ?? null,
      rejection_reason: reason,
    })
    .eq('booking_ref', ref)

  if (booking.room_id) {
    await db
      .from('partner_rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id)
  }

  await sendBookingRefundEmail({
    to:         booking.guest_email,
    guestName:  booking.guest_name,
    roomTitle:  booking.partner_rooms?.title ?? 'the room',
    amount:     booking.platform_fee,
    bookingRef: ref,
    reason,
  })

  return { success: true, refundId }
}
