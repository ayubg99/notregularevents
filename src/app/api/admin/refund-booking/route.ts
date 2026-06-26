import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import type { TicketStatus } from '@/types/database'

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json() as { bookingId: string }

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin  = getAdminClient()
  const stripe = getStripe()

  const { data: ticket, error } = await admin
    .from('event_tickets')
    .select('id, stripe_payment_id, amount_paid, guest_email, guest_name, event_id')
    .eq('id', bookingId)
    .single()

  if (error || !ticket) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const stripePaymentId = ticket.stripe_payment_id

  if (stripePaymentId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(stripePaymentId)
      if (session.payment_intent) {
        await stripe.refunds.create({
          payment_intent:          session.payment_intent as string,
          reason:                  'requested_by_customer',
          refund_application_fee: true,
          reverse_transfer:       true,
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

  return NextResponse.json({ success: true })
}
