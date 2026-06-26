'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Download, X } from 'lucide-react'
import type { EventTicketRow } from '@/types/database'

type EventTicketWithEvent = EventTicketRow & {
  events: { id: string; title: string; date: string; location: string | null; slug: string } | null
}

interface Props {
  eventTickets: EventTicketWithEvent[]
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/15 text-green-400 border-green-500/30',
  confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
  used:      'bg-white/10 text-white/40 border-white/10',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  refunded:  'bg-orange-500/15 text-orange-400 border-yellow-500/30',
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

export default function BookingTabs({ eventTickets }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [now] = useState(() => Date.now())
  const [selectedTicket, setSelectedTicket] = useState<EventTicketWithEvent | null>(null)

  const upcoming = eventTickets.filter(t =>
    isUpcoming(t.events?.date, now) && t.status !== 'cancelled' && t.status !== 'refunded'
  )
  const past = eventTickets.filter(t =>
    !isUpcoming(t.events?.date, now) || t.status === 'cancelled' || t.status === 'refunded'
  )

  const items = tab === 'upcoming' ? upcoming : past

  return (
    <>
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
            {items.map(ticket => {
              const title    = ticket.events?.title
              const dateStr  = ticket.events?.date
              const location = ticket.events?.location
              const slug     = ticket.events?.slug
              const href     = slug ? `/events/${slug}` : '#'
              const ref      = ticket.booking_ref
              const qr       = ticket.qr_code
              const status   = ticket.status

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
                        Event
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
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (() => {
        const ticket  = selectedTicket
        const title    = ticket.events?.title
        const dateStr  = ticket.events?.date
        const location = ticket.events?.location
        const qr       = ticket.qr_code
        const ref      = ticket.booking_ref
        const status   = ticket.status
        const amount   = ticket.amount_paid
        const bookedAt = ticket.created_at

        return (
          <div
            onClick={() => setSelectedTicket(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-brand-dark border border-white/15 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="font-heading font-bold text-white text-lg">Booking Details</h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white/5 border border-white/10">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="QR Code" width={180} height={180} className="rounded-lg" />
                  ) : (
                    <div className="w-44 h-44 rounded-lg bg-white/10 flex items-center justify-center">
                      <p className="text-white/30 text-xs text-center px-4">QR code not available</p>
                    </div>
                  )}
                  <p className="text-white/40 text-xs font-mono tracking-widest">{ref}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <DetailRow label="Event" value={title ?? 'Unknown'} bold />
                  {dateStr && (
                    <DetailRow
                      label="Date"
                      value={new Date(dateStr).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    />
                  )}
                  {location && <DetailRow label="Location" value={location} />}
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
                    onClick={() => setSelectedTicket(null)}
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
