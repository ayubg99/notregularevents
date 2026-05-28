'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Download, ExternalLink, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { EventTicketRow, TripBookingRow, HousingListingRow } from '@/types/database'

type EventTicketWithEvent = EventTicketRow & {
  events: { id: string; title: string; date: string; location: string | null; slug: string } | null
}

type TripBookingWithTrip = TripBookingRow & {
  trips: { id: string; title: string; start_date: string; destination: string; slug: string; whatsapp_group_url: string | null } | null
}

type SelectedBooking =
  | { kind: 'event'; data: EventTicketWithEvent }
  | { kind: 'trip';  data: TripBookingWithTrip  }

interface Props {
  eventTickets: EventTicketWithEvent[]
  tripBookings: TripBookingWithTrip[]
  myListings:   HousingListingRow[]
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

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-white/50 text-sm flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${bold ? 'text-white font-semibold' : 'text-white/80'}`}>
        {value}
      </span>
    </div>
  )
}

export default function BookingTabs({ eventTickets, tripBookings, myListings }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past' | 'listings'>('upcoming')
  const [now] = useState(() => Date.now())
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null)
  const [listings, setListings] = useState<HousingListingRow[]>(myListings)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

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

  async function handleDeleteListing(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return
    const supabase = createClient()
    const { error } = await supabase.from('housing_listings').delete().eq('id', id)
    if (error) { setToast('Error: ' + error.message); return }
    setListings(prev => prev.filter(l => l.id !== id))
    setToast('Listing deleted')
  }

  async function handleMarkRented(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('housing_listings')
      .update({ status: 'rented' })
      .eq('id', id)
    if (error) { setToast('Error: ' + error.message); return }
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rented' } : l))
    setToast('Marked as rented')
  }

  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-bold text-white">
            {tab === 'listings' ? 'My Listings' : 'My Bookings'}
          </h2>
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
            <button
              onClick={() => setTab('listings')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                tab === 'listings' ? 'bg-brand-primary text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Listings
              <span className="ml-1.5 opacity-60">{listings.length}</span>
            </button>
          </div>
        </div>

        {/* ── My Listings tab ──────────────────────────────────── */}
        {tab === 'listings' && (
          <>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🏠</p>
                <p className="text-white/30 text-sm mb-4">No listings yet</p>
                <Link
                  href="/housing/post"
                  className="inline-block bg-brand-accent text-brand-dark px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-110 transition-all"
                >
                  + Post a Room
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {listings.map(listing => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          listing.type === 'room_available'
                            ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {listing.type === 'room_available' ? '🏠 Room Available' : '👤 Looking for Room'}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          listing.status === 'active'
                            ? 'bg-green-500/15 text-green-400 border-green-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}>
                          {listing.status === 'active' ? '● Active' : '● ' + listing.status}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm truncate">{listing.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {listing.neighborhood && `📍 ${listing.neighborhood}`}
                        {listing.price && ` • €${listing.price}/mo`}
                        {listing.expires_at && ` • Expires ${new Date(listing.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Link
                        href={`/housing/edit/${listing.id}`}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs transition-colors text-center"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}

                <Link
                  href="/housing/post"
                  className="block text-center py-3 rounded-xl border border-brand-accent/30 bg-brand-accent/10 text-brand-accent font-semibold text-sm hover:bg-brand-accent/20 transition-colors"
                >
                  + Post Another Listing
                </Link>
              </div>
            )}
          </>
        )}

        {/* ── Bookings tabs ────────────────────────────────────── */}
        {tab !== 'listings' && (
          <>
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
                      onClick={() => setSelectedBooking({ kind, data } as SelectedBooking)}
                      className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all duration-150"
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
                        <Link
                          href={href}
                          onClick={e => e.stopPropagation()}
                          className="text-white font-semibold text-sm hover:text-brand-primary transition-colors truncate block"
                        >
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
                        <p className="text-white/20 text-xs mt-1.5">Tap to view ticket →</p>
                      </div>

                      <div
                        className="flex flex-col gap-2 flex-shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
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
          </>
        )}

        {/* Toast */}
        {toast && (
          <div className="mt-4 text-center text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl py-2">
            {toast}
          </div>
        )}
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (() => {
        const { kind, data } = selectedBooking
        const isEvent = kind === 'event'
        const ticket  = data as EventTicketWithEvent
        const booking = data as TripBookingWithTrip

        const title    = isEvent ? ticket.events?.title     : booking.trips?.title
        const dateStr  = isEvent ? ticket.events?.date      : booking.trips?.start_date
        const location = isEvent ? ticket.events?.location  : booking.trips?.destination
        const tier     = isEvent ? null                     : booking.tier
        const qr       = data.qr_code
        const ref      = data.booking_ref
        const status   = data.status
        const amount   = data.amount_paid
        const bookedAt = data.created_at

        return (
          <div
            onClick={() => setSelectedBooking(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-brand-dark border border-white/15 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="font-heading font-bold text-white text-lg">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* QR code */}
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white/5 border border-white/10">
                  {qr ? (
                    <img src={qr} alt="QR Code" width={180} height={180} className="rounded-lg" />
                  ) : (
                    <div className="w-44 h-44 rounded-lg bg-white/10 flex items-center justify-center">
                      <p className="text-white/30 text-xs text-center px-4">QR code not available</p>
                    </div>
                  )}
                  <p className="text-white/40 text-xs font-mono tracking-widest">{ref}</p>
                </div>

                {/* Detail rows */}
                <div className="flex flex-col gap-3">
                  <DetailRow label={isEvent ? 'Event' : 'Trip'} value={title ?? 'Unknown'} bold />
                  {dateStr && (
                    <DetailRow
                      label="Date"
                      value={new Date(dateStr).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    />
                  )}
                  {location && <DetailRow label="Location" value={location} />}
                  {tier && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">Tier</span>
                      <span className="bg-brand-primary/20 text-brand-primary px-2.5 py-0.5 rounded-full text-xs font-bold capitalize">
                        {tier.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Amount paid</span>
                    <span className="text-green-400 font-semibold text-sm">
                      {amount != null ? `€${amount.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Status</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] ?? STATUS_COLORS.active}`}>
                      {status}
                    </span>
                  </div>
                  <DetailRow
                    label="Booked on"
                    value={new Date(bookedAt).toLocaleDateString('en-GB')}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  {qr && (
                    <button
                      onClick={() => downloadQR(qr, ref)}
                      className="w-full py-3 rounded-xl bg-brand-primary hover:brightness-110 text-white font-semibold text-sm transition-all"
                    >
                      Download QR Ticket
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-full py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
