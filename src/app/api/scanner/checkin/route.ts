import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { bookingId, type } = await req.json() as { bookingId: string; type: 'event' | 'trip' }

  if (!bookingId || !type) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  const admin = getAdminClient()
  const table = type === 'event' ? 'event_tickets' : 'trip_bookings'

  const { error } = await admin
    .from(table)
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
