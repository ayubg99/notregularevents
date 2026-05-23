import { getAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import TripAttendeesClient from './TripAttendeesClient'

export default async function TripAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin   = getAdminClient()

  const [{ data: trip, error: tripError }, { data: bookings }] = await Promise.all([
    admin
      .from('trips')
      .select('id, title, start_date, capacity, seats_sold, destination')
      .eq('id', id)
      .single(),
    admin
      .from('trip_bookings')
      .select('id, booking_ref, status, tier, guest_name, guest_email, guest_phone, amount_paid, quantity, qr_code, created_at, checked_in, checked_in_at')
      .eq('trip_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (tripError || !trip) notFound()

  return (
    <TripAttendeesClient
      trip={trip as {
        id: string
        title: string
        start_date: string
        capacity: number
        seats_sold: number
        destination: string
      }}
      bookings={(bookings ?? []) as {
        id: string
        booking_ref: string
        status: string
        tier: string
        guest_name: string | null
        guest_email: string | null
        guest_phone: string | null
        amount_paid: number | null
        quantity:    number
        qr_code:     string | null
        created_at:  string
        checked_in:  boolean | null
        checked_in_at: string | null
      }[]}
    />
  )
}
