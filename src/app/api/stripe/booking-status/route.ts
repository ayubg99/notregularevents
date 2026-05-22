import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ found: false }, { status: 401 })
  }

  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ found: false }, { status: 400 })
  }

  // Check event_tickets first
  const { data: ticket } = await supabase
    .from('event_tickets')
    .select('id, booking_ref, qr_code, status, event_id')
    .eq('stripe_payment_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (ticket) {
    return NextResponse.json({ found: true, type: 'event', booking: ticket })
  }

  // Then trip_bookings
  const { data: tripBooking } = await supabase
    .from('trip_bookings')
    .select('id, booking_ref, qr_code, status, trip_id, tier')
    .eq('stripe_payment_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (tripBooking) {
    return NextResponse.json({ found: true, type: 'trip', booking: tripBooking })
  }

  // Membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('id, plan, status, start_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  if (membership) {
    return NextResponse.json({ found: true, type: 'membership', booking: membership })
  }

  return NextResponse.json({ found: false })
}
