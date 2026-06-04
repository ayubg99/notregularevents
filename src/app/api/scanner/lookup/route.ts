import { NextResponse } from'next/server'
import { getAdminClient } from'@/lib/supabase/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')

  if (!ref) return NextResponse.json({ valid: false })

  const admin = getAdminClient()
  const normalized = ref.toUpperCase().trim()

  const [{ data: eventTicket }, { data: tripBooking }] = await Promise.all([
    admin.from('event_tickets').select('*, events!inner(title, date, location)').eq('booking_ref', normalized).maybeSingle(),
    admin.from('trip_bookings').select('*, trips!inner(title, start_date, destination)').eq('booking_ref', normalized).maybeSingle(),
  ])

  const booking = eventTicket || tripBooking
  const isEvent = !!eventTicket

  if (!booking) {
    return NextResponse.json({ valid: false, error:'Ticket not found' })
  }

  const title = isEvent
    ? (eventTicket as unknown as { events: { title: string } | null }).events?.title
    : (tripBooking as unknown as { trips: { title: string } | null }).trips?.title

  const payload = { ...booking, type: isEvent ?'event' :'trip', title }

  if (booking.checked_in) {
    return NextResponse.json({ valid: false, alreadyScanned: true, booking: payload })
  }

  // event_tickets uses'active', trip_bookings uses'confirmed'
  const isValid = isEvent ? booking.status ==='active' : booking.status ==='confirmed'
  if (!isValid) {
    return NextResponse.json({ valid: false, error:'Booking not confirmed' })
  }

  return NextResponse.json({ valid: true, booking: payload })
}
