'use client'

import { useQuery } from'@tanstack/react-query'
import { createClient } from'@/lib/supabase/client'
import type { EventTicketRow, TripBookingRow } from'@/types/database'

type EventTicketWithEvent = EventTicketRow & {
  events: { id: string; title: string; date: string; location: string | null; slug: string } | null
}

type TripBookingWithTrip = TripBookingRow & {
  trips: { id: string; title: string; start_date: string; destination: string; slug: string; whatsapp_group_url: string | null } | null
}

export function useBookings(userId: string | undefined) {
  const supabase = createClient()

  const { data: eventBookings = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['event-bookings', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('event_tickets')
        .select('*, events(id, title, date, location, slug)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      return (data ?? []) as unknown as EventTicketWithEvent[]
    },
  })

  const { data: tripBookings = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trip-bookings', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('trip_bookings')
        .select('*, trips(id, title, start_date, destination, slug, whatsapp_group_url)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      return (data ?? []) as unknown as TripBookingWithTrip[]
    },
  })

  return {
    eventBookings,
    tripBookings,
    isLoading: eventsLoading || tripsLoading,
  }
}
