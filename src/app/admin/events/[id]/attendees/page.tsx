import { getAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import EventAttendeesClient from './EventAttendeesClient'

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin   = getAdminClient()

  const [{ data: event, error: eventError }, { data: tickets }] = await Promise.all([
    admin
      .from('events')
      .select('id, title, date, capacity, tickets_sold, location')
      .eq('id', id)
      .single(),
    admin
      .from('event_tickets')
      .select('id, booking_ref, status, guest_name, guest_email, guest_phone, amount_paid, qr_code, created_at, checked_in, checked_in_at')
      .eq('event_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (eventError || !event) notFound()

  return (
    <EventAttendeesClient
      event={event as {
        id: string
        title: string
        date: string
        capacity: number
        tickets_sold: number
        location: string | null
      }}
      tickets={(tickets ?? []) as {
        id: string
        booking_ref: string
        status: string
        guest_name: string | null
        guest_email: string | null
        guest_phone: string | null
        amount_paid: number | null
        qr_code:     string | null
        created_at: string
        checked_in: boolean | null
        checked_in_at: string | null
      }[]}
    />
  )
}
