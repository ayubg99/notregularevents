import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { stripe } from '@/lib/stripe'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ found: false }, { status: 400 })
  }

  // Use admin client — session IDs are Stripe-generated secrets, safe as lookup keys
  const admin = getAdminClient()

  const { data: ticket } = await admin
    .from('event_tickets')
    .select('id, booking_ref, qr_code, status, event_id, guest_email, user_id')
    .eq('stripe_payment_id', sessionId)
    .maybeSingle()

  if (ticket) {
    return NextResponse.json({ found: true, type: 'event', booking: ticket })
  }

  const { data: tripBooking } = await admin
    .from('trip_bookings')
    .select('id, booking_ref, qr_code, status, trip_id, tier, guest_email, user_id')
    .eq('stripe_payment_id', sessionId)
    .maybeSingle()

  if (tripBooking) {
    return NextResponse.json({ found: true, type: 'trip', booking: tripBooking })
  }

  // Not an event or trip — check if this is a membership payment so polling doesn't spin forever
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.mode === 'subscription' && session.metadata?.type === 'membership') {
      return NextResponse.json({ found: true, type: 'membership' })
    }
  } catch { /* stripe not configured or session expired — fall through */ }

  return NextResponse.json({ found: false })
}
