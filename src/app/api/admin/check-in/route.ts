import { NextRequest, NextResponse } from'next/server'
import { getAdminClient } from'@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { bookingId, type } = await req.json() as { bookingId: string; type:'event' |'trip' }

  if (!bookingId || !type) {
    return NextResponse.json({ error:'Missing required fields' }, { status: 400 })
  }

  const admin = getAdminClient()
  const checked_in_at = new Date().toISOString()

  if (type ==='event') {
    const { error } = await admin
      .from('event_tickets')
      .update({ checked_in: true, checked_in_at })
      .eq('id', bookingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin
      .from('trip_bookings')
      .update({ checked_in: true, checked_in_at })
      .eq('id', bookingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, checked_in_at })
}
