'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Download, ExternalLink } from 'lucide-react'
import type { EventTicketRow, TripBookingRow } from '@/types/database'

type EventTicketWithEvent = EventTicketRow & {
  events: { id: string; title: string; date: string; location: string | null; slug: string } | null
}

type TripBookingWithTrip = TripBookingRow & {
  trips: { id: string; title: string; start_date: string; destination: string; slug: string; whatsapp_group_url: string | null } | null
}

interface Props {
  eventTickets: EventTicketWithEvent[]
  tripBookings: TripBookingWithTrip[]
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/15 text-green-400 border-green-500/30',
  confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
  used:      'bg-white/10 text-white/40 border-white/10',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  refunded:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  pending:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

function isUpcoming(dateStr: string | undefined, now: number): boolean {
  if (!dateStr) return false
  return new Date(dateStr).getTime() > now
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

function downloadQR(qrCode: string, ref: string) {
  const a = document.createElement('a')
  a.href = qrCode
  a.download = `ticket-${ref}.png`
  a.click()
}

export default function BookingTabs({ eventTickets, tripBookings }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [now] = useState(() => Date.now())

  const upcomingEvents = eventTickets.filter(t =>
    isUpcoming(t.events?.date, now) && t.status !== 'cancelled' && t.status !== 'refunded'
  )
  const pastEvents = eventTickets.filter(t =>
    !isUpcoming(t.events?.date, now) || t.status === 'cancelled' || t.status === 'refunded'
  )

  const upcomingTrips = tripBookings.filter(t =>
    isUpcoming(t.trips?.start_date, now) && t.status !== 'cancelled' && t.status !== 'refunded'
  )
  const pastTrips = tripBookings.filter(t =>
    !isUpcoming(t.trips?.start_date, now) || t.status === 'cancelled' || t.status === 'refunded'
  )

  const upcoming = [...upcomingEvents.map(t => ({ kind: 'event' as const, data: t })),
                    ...upcomingTrips.map(t => ({ kind: 'trip' as const, data: t }))]
  const past     = [...pastEvents.map(t => ({ kind: 'event' as const, data: t })),
                    ...pastTrips.map(t => ({ kind: 'trip' as const, data: t }))]

  const items = tab === 'upcoming' ? upcoming : past

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg font-bold text-white">My Bookings</h2>
        <div className="flex gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
          {(['upcoming', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 capitalize ${
                tab === t ? 'bg-brand-primary text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t}
              <span className="ml-1.5 opacity-60">
                {t === 'upcoming' ? upcoming.length : past.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm">No {tab} bookings</p>
          {tab === 'upcoming' && (
            <Link href="/events" className="inline-block mt-3 text-brand-primary text-sm hover:brightness-110 transition-colors">
              Browse events →
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(({ kind, data }) => {
            const isEvent = kind === 'event'
            const ticket  = data as EventTicketWithEvent
            const booking = data as TripBookingWithTrip

            const title    = isEvent ? ticket.events?.title    : booking.trips?.title
            const dateStr  = isEvent ? ticket.events?.date     : booking.trips?.start_date
            const location = isEvent ? ticket.events?.location : booking.trips?.destination
            const slug     = isEvent ? ticket.events?.slug     : booking.trips?.slug
            const href     = slug ? `/${isEvent ? 'events' : 'trips'}/${slug}` : '#'
            const ref      = data.booking_ref
            const qr       = data.qr_code
            const status   = data.status

            return (
              <div
                key={data.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
                      {isEvent ? 'Event' : 'Trip'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] ?? STATUS_COLORS.active}`}>
                      {status}
                    </span>
                  </div>
                  <Link href={href} className="text-white font-semibold text-sm hover:text-brand-primary transition-colors truncate block">
                    {title ?? 'Unknown'}
                  </Link>
                  <div className="flex items-center gap-3 mt-1.5 text-white/40 text-xs flex-wrap">
                    {dateStr && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(dateStr)}
                      </span>
                    )}
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {location}
                      </span>
                    )}
                  </div>
                  <p className="text-white/25 text-xs mt-1 font-mono tracking-widest">Ref: {ref}</p>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {qr && (
                    <button
                      onClick={() => downloadQR(qr, ref)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs transition-colors"
                    >
                      <Download size={12} />
                      QR
                    </button>
                  )}
                  {!isEvent && booking.trips?.whatsapp_group_url && (
                    <a
                      href={booking.trips.whatsapp_group_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs transition-colors"
                    >
                      <ExternalLink size={12} />
                      Group
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
