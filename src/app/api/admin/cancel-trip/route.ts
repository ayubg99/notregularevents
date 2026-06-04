import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { sendRefundEmail } from '@/lib/email'
import type { BookingStatus, TripStatus } from '@/types/database'

// GET ?tripId=X — returns { count, total } for confirmation modal preview
export async function GET(req: NextRequest) {
  const tripId = req.nextUrl.searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })

  const admin = getAdminClient()
  const { data: bookings, error } = await admin
    .from('trip_bookings')
    .select('amount_paid')
    .eq('trip_id', tripId)
    .eq('status', 'confirmed')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const count = bookings?.length ?? 0
  const total = bookings?.reduce((sum, b) => sum + (b.amount_paid ?? 0), 0) ?? 0

  return NextResponse.json({ count, total })
}

// POST { tripId } — cancel trip and refund all confirmed bookings
export async function POST(req: NextRequest) {
  const { tripId } = await req.json() as { tripId: string }
  if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })

  const admin  = getAdminClient()
  const stripe = getStripe()

  // Fetch trip for title
  const { data: trip, error: tripErr } = await admin
    .from('trips')
    .select('id, title')
    .eq('id', tripId)
    .single()

  if (tripErr || !trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // Fetch all confirmed bookings
  const { data: bookings, error: bookingsErr } = await admin
    .from('trip_bookings')
    .select('id, stripe_payment_id, amount_paid, guest_email, guest_name')
    .eq('trip_id', tripId)
    .eq('status', 'confirmed')

  if (bookingsErr) return NextResponse.json({ error: bookingsErr.message }, { status: 500 })

  const results: { id: string; success: boolean; error?: string }[] = []

  for (const booking of bookings ?? []) {
    try {
      if (booking.stripe_payment_id) {
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_payment_id)
        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason:         'requested_by_customer',
          })
        }
      }

      await admin
        .from('trip_bookings')
        .update({ status: 'refunded' as BookingStatus })
        .eq('id', booking.id)

      if (booking.guest_email && booking.guest_name) {
        await sendRefundEmail({
          email:     booking.guest_email,
          name:      booking.guest_name,
          tripTitle: trip.title,
          amount:    booking.amount_paid ?? 0,
          reason:    'Trip has been cancelled.',
        })
      }

      results.push({ id: booking.id, success: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[cancel-trip] refund failed for booking', booking.id, err)
      results.push({ id: booking.id, success: false, error: message })
    }
  }

  // Mark trip as cancelled
  await admin
    .from('trips')
    .update({ status: 'cancelled' as TripStatus })
    .eq('id', tripId)

  const refunded = results.filter(r => r.success).length
  const failed   = results.length - refunded

  return NextResponse.json({ success: true, refunded, failed })
}
