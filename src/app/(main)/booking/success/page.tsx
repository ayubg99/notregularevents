import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BookingConfirmation from './BookingConfirmation'
import BookingPolling from './BookingPolling'

export const metadata: Metadata = {
  title: 'Booking Confirmed | Erasmus Vibe Valencia',
}

type Props = {
  searchParams: Promise<{ session_id?: string; ref?: string }>
}

function buildIcs(params: {
  title:    string
  start:    string
  end:      string
  location: string
  ref:      string
}): string {
  const fmt = (d: string) =>
    new Date(d).toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Erasmus Vibe//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(params.start)}`,
    `DTEND:${fmt(params.end)}`,
    `SUMMARY:${params.title}`,
    `LOCATION:${params.location}`,
    `DESCRIPTION:Booking ref: ${params.ref}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { session_id, ref } = await searchParams

  return (
    <main className="min-h-screen bg-brand-dark pt-28 pb-24">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {session_id ? (
          <StripeSuccessContent sessionId={session_id} />
        ) : ref ? (
          <FreeBookingContent bookingRef={ref} />
        ) : (
          <div className="text-center py-16">
            <p className="text-white/40">No booking information found.</p>
            <Link href="/" className="mt-4 inline-block text-brand-primary hover:underline text-sm">
              Return home
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Paid booking (Stripe session_id) ─────────────────────────────

async function StripeSuccessContent({ sessionId }: { sessionId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">Please log in to view your booking.</p>
      </div>
    )
  }

  // Try to find the booking (webhook may have already fired)
  const [ticketResult, tripResult] = await Promise.all([
    supabase
      .from('event_tickets')
      .select('booking_ref, qr_code, event_id')
      .eq('stripe_payment_id', sessionId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('trip_bookings')
      .select('booking_ref, qr_code, trip_id')
      .eq('stripe_payment_id', sessionId)
      .eq('user_id', user.id)
      .single(),
  ])

  // Event booking found
  if (ticketResult.data) {
    const booking = ticketResult.data
    const { data: event } = await supabase
      .from('events')
      .select('title, date, location')
      .eq('id', booking.event_id)
      .single()

    const icsContent = event
      ? buildIcs({
          title:    event.title,
          start:    event.date,
          end:      new Date(new Date(event.date).getTime() + 3 * 60 * 60 * 1000).toISOString(),
          location: event.location ?? 'Valencia',
          ref:      booking.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={booking.booking_ref}
        qrCode={booking.qr_code}
        icsContent={icsContent}
        title={event?.title}
      />
    )
  }

  // Trip booking found
  if (tripResult.data) {
    const booking = tripResult.data
    const { data: trip } = await supabase
      .from('trips')
      .select('title, start_date, end_date, destination, whatsapp_group_url')
      .eq('id', booking.trip_id)
      .single()

    const icsContent = trip
      ? buildIcs({
          title:    trip.title,
          start:    trip.start_date,
          end:      trip.end_date,
          location: trip.destination,
          ref:      booking.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={booking.booking_ref}
        qrCode={booking.qr_code}
        icsContent={icsContent}
        whatsappUrl={trip?.whatsapp_group_url ?? undefined}
        title={trip?.title}
      />
    )
  }

  // Webhook hasn't fired yet — poll
  return <BookingPolling sessionId={sessionId} />
}

// ── Free booking (ref query param) ───────────────────────────────

async function FreeBookingContent({ bookingRef }: { bookingRef: string }) {
  const supabase = await createClient()

  // Try event_tickets first
  const { data: ticket } = await supabase
    .from('event_tickets')
    .select('booking_ref, qr_code, event_id')
    .eq('booking_ref', bookingRef)
    .single()

  if (ticket) {
    const { data: event } = await supabase
      .from('events')
      .select('title, date, location')
      .eq('id', ticket.event_id)
      .single()

    const icsContent = event
      ? buildIcs({
          title:    event.title,
          start:    event.date,
          end:      new Date(new Date(event.date).getTime() + 3 * 60 * 60 * 1000).toISOString(),
          location: event.location ?? 'Valencia',
          ref:      ticket.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={ticket.booking_ref}
        qrCode={ticket.qr_code}
        icsContent={icsContent}
        title={event?.title}
      />
    )
  }

  // Try trip_bookings
  const { data: tripBooking } = await supabase
    .from('trip_bookings')
    .select('booking_ref, qr_code, trip_id')
    .eq('booking_ref', bookingRef)
    .single()

  if (tripBooking) {
    const { data: trip } = await supabase
      .from('trips')
      .select('title, start_date, end_date, destination, whatsapp_group_url')
      .eq('id', tripBooking.trip_id)
      .single()

    const icsContent = trip
      ? buildIcs({
          title:    trip.title,
          start:    trip.start_date,
          end:      trip.end_date,
          location: trip.destination,
          ref:      tripBooking.booking_ref,
        })
      : undefined

    return (
      <BookingConfirmation
        bookingRef={tripBooking.booking_ref}
        qrCode={tripBooking.qr_code}
        icsContent={icsContent}
        whatsappUrl={trip?.whatsapp_group_url ?? undefined}
        title={trip?.title}
      />
    )
  }

  return (
    <div className="text-center py-16">
      <p className="text-white/40">Booking not found for reference: {bookingRef}</p>
    </div>
  )
}
