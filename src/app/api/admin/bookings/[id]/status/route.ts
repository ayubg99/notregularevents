import { NextRequest, NextResponse } from'next/server'
import { getAdminClient } from'@/lib/supabase/admin'
import type { TicketStatus, BookingStatus } from'@/types/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { type, status } = await req.json() as { type:'event' |'trip'; status: string }

  if (!id || !type || !status) {
    return NextResponse.json({ error:'Missing required fields' }, { status: 400 })
  }

  const admin = getAdminClient()

  if (type ==='event') {
    const { error } = await admin
      .from('event_tickets')
      .update({ status: status as TicketStatus })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin
      .from('trip_bookings')
      .update({ status: status as BookingStatus })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, status })
}
