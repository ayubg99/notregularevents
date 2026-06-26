import { getAdminClient } from '@/lib/supabase/admin'
import BookingsClient from './BookingsClient'

export const dynamic = 'force-dynamic'

export default async function AdminBookingsPage() {
  const admin = getAdminClient()

  const [
    { data: eventTickets },
    { data: tripBookingsRaw },
    { data: tripsRaw },
  ] = await Promise.all([
    admin
      .from('event_tickets')
      .select('id, booking_ref, status, created_at, guest_name, guest_email, guest_phone, stripe_payment_id, amount_paid, qr_code, group_booking_ref, is_group_booking, lead_name, lead_email, referral_code, ticket_tier_name, promo_code_used, events(title, date, location)')
      .order('created_at', { ascending: false }),
    admin
      .from('trip_bookings')
      .select('id, trip_id, booking_ref, status, created_at, guest_name, guest_email, guest_phone, stripe_payment_id, tier, amount_paid, quantity, qr_code, referral_code, selected_extras, promo_code_used')
      .order('created_at', { ascending: false }),
    admin
      .from('trips')
      .select('id, title, start_date, destination'),
  ])

  const tripMap = Object.fromEntries((tripsRaw ?? []).map(t => [t.id, t]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tripBookings = (tripBookingsRaw ?? []).map((b: any) => ({
    ...b,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trips: tripMap[(b as any).trip_id] ?? null,
  }))

  const allBookings = [
    ...(eventTickets ?? []).map(b => ({
      id:                b.id,
      type:              'Event' as const,
      booking_ref:       b.booking_ref,
      status:            b.status,
      created_at:        b.created_at,
      guest_name:        b.guest_name,
      guest_email:       b.guest_email,
      guest_phone:       b.guest_phone,
      stripe_payment_id: b.stripe_payment_id,
      title:    (b.events as unknown as { title: string } | null)?.title    ?? 'Unknown Event',
      date:     (b.events as unknown as { date: string }  | null)?.date     ?? null,
      price:    b.amount_paid ?? null,
      location: (b.events as unknown as { location: string } | null)?.location ?? null,
      tier:              null as string | null,
      quantity:          1,
      qr_code:           b.qr_code           ?? null,
      group_booking_ref: b.group_booking_ref  ?? null,
      is_group_booking:  b.is_group_booking   ?? false,
      lead_name:         b.lead_name          ?? null,
      lead_email:        b.lead_email         ?? null,
      referral_code:     b.referral_code      ?? null,
      ticket_tier_name:  b.ticket_tier_name   ?? null,
      promo_code_used:   b.promo_code_used    ?? null,
      selected_extras:   null as { id: string; name: string; price: number; description: string }[] | null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((tripBookings ?? []) as any[]).map((b: any) => ({
      id:                b.id,
      type:              'Trip' as const,
      booking_ref:       b.booking_ref,
      status:            b.status,
      created_at:        b.created_at,
      guest_name:        b.guest_name,
      guest_email:       b.guest_email,
      guest_phone:       b.guest_phone,
      stripe_payment_id: b.stripe_payment_id,
      title:    (b.trips as unknown as { title: string }       | null)?.title       ?? 'Unknown Trip',
      date:     (b.trips as unknown as { start_date: string }  | null)?.start_date  ?? null,
      price:    b.amount_paid ?? null,
      location: (b.trips as unknown as { destination: string } | null)?.destination ?? null,
      tier:              b.tier as string | null,
      quantity:          b.quantity ?? 1,
      qr_code:           b.qr_code          ?? null,
      group_booking_ref: null,
      is_group_booking:  false,
      lead_name:         null,
      lead_email:        null,
      referral_code:     b.referral_code    ?? null,
      ticket_tier_name:  null as string | null,
      promo_code_used:   b.promo_code_used    ?? null,
      selected_extras:   b.selected_extras    ?? null,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return <BookingsClient bookings={allBookings} />
}
