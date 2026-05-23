import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { sendRefundEmail } from '@/lib/email'
import type { BookingStatus, TicketStatus } from '@/types/database'

export async function POST(req: NextRequest) {
  const { bookingId, type } = await req.json() as { bookingId: string; type: 'event' | 'trip' }

  if (!bookingId || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin  = getAdminClient()
  const stripe = getStripe()

  let stripePaymentId: string | null = null
  let amountPaid:      number | null = null
  let guestEmail:      string | null = null
  let guestName:       string | null = null
  let itemTitle                      = 'your booking'

  if (type === 'event') {
    const { data: ticket, error } = await admin
      .from('event_tickets')
      .select('id, stripe_payment_id, amount_paid, guest_email, guest_name, event_id')
      .eq('id', bookingId)
      .single()

    if (error || !ticket) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    stripePaymentId = ticket.stripe_payment_id
    amountPaid      = ticket.amount_paid
    guestEmail      = ticket.guest_email
    guestName       = ticket.guest_name

    if (ticket.event_id) {
      const { data: event } = await admin.from('events').select('title').eq('id', ticket.event_id).single()
      if (event) itemTitle = event.title
    }

    // Issue Stripe refund
    if (stripePaymentId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(stripePaymentId)
        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason:         'requested_by_customer',
          })
        }
      } catch (err) {
        console.error('[refund-booking] Stripe refund failed:', err)
        return NextResponse.json({ error: 'Stripe refund failed' }, { status: 500 })
      }
    }

    const { error: updateErr } = await admin
      .from('event_tickets')
      .update({ status: 'refunded' as TicketStatus })
      .eq('id', bookingId)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  } else {
    const { data: booking, error } = await admin
      .from('trip_bookings')
      .select('id, stripe_payment_id, amount_paid, guest_email, guest_name, trip_id')
      .eq('id', bookingId)
      .single()

    if (error || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    stripePaymentId = booking.stripe_payment_id
    amountPaid      = booking.amount_paid
    guestEmail      = booking.guest_email
    guestName       = booking.guest_name

    if (booking.trip_id) {
      const { data: trip } = await admin.from('trips').select('title').eq('id', booking.trip_id).single()
      if (trip) itemTitle = trip.title
    }

    // Issue Stripe refund
    if (stripePaymentId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(stripePaymentId)
        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason:         'requested_by_customer',
          })
        }
      } catch (err) {
        console.error('[refund-booking] Stripe refund failed:', err)
        return NextResponse.json({ error: 'Stripe refund failed' }, { status: 500 })
      }
    }

    const { error: updateErr } = await admin
      .from('trip_bookings')
      .update({ status: 'refunded' as BookingStatus })
      .eq('id', bookingId)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Send refund email
  if (guestEmail && guestName) {
    await sendRefundEmail({
      email:     guestEmail,
      name:      guestName,
      tripTitle: itemTitle,
      amount:    amountPaid ?? 0,
      reason:    'This booking has been refunded by our team.',
    })
  }

  return NextResponse.json({ success: true })
}
