import { getAdminClient } from '@/lib/supabase/admin'
import BookingsClient from './BookingsClient'

export default async function AdminBookingsPage() {
  const admin = getAdminClient()

  const [
    { data: eventTickets },
    { data: tripBookings },
  ] = await Promise.all([
    admin
      .from('event_tickets')
      .select('*, events(title, date), users(email, full_name)')
      .order('created_at', { ascending: false }),
    admin
      .from('trip_bookings')
      .select('*, trips(title, start_date), users(email, full_name)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <BookingsClient
      eventTickets={eventTickets as never ?? []}
      tripBookings={tripBookings as never ?? []}
    />
  )
}
