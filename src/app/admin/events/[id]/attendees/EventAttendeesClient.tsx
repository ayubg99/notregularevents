'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileText, Search, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

type Ticket = {
  id:            string
  booking_ref:   string
  status:        string
  guest_name:    string | null
  guest_email:   string | null
  guest_phone:   string | null
  amount_paid:   number | null
  qr_code:       string | null
  created_at:    string
  checked_in:    boolean | null
  checked_in_at: string | null
}

type EventInfo = {
  id:           string
  title:        string
  date:         string
  capacity:     number
  tickets_sold: number
  location:     string | null
}

interface Props {
  event:   EventInfo
  tickets: Ticket[]
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/15 text-green-400',
  used:      'bg-white/10 text-white/40',
  cancelled: 'bg-red-500/15 text-red-400',
  refunded:  'bg-orange-500/15 text-orange-400',
}

function buildCSV(event: EventInfo, rows: Ticket[]): string {
  const headers = ['#', 'Name', 'Email', 'Phone', 'Booking Ref', 'QR Code', 'Status', 'Amount', 'Checked In', 'Check-in Time', 'Booked At']
  const lines = [
    headers.join(','),
    ...rows.map((t, i) => [
      i + 1,
      t.guest_name  ?? 'Member',
      t.guest_email ?? '',
      t.guest_phone ?? '',
      t.booking_ref,
      t.qr_code    ?? '',
      t.status,
      t.amount_paid != null ? `€${t.amount_paid.toFixed(2)}` : '',
      t.checked_in ? 'Yes' : 'No',
      t.checked_in_at ? new Date(t.checked_in_at).toLocaleString('en-GB') : '',
      new Date(t.created_at).toLocaleString('en-GB'),
    ].join(',')),
  ]
  return lines.join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function CheckInButton({ ticket, type }: { ticket: Ticket; type: 'event' | 'trip' }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (ticket.checked_in) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
          <CheckCircle size={12} /> Checked in
        </span>
        {ticket.checked_in_at && (
          <span className="text-white/25 text-xs">
            {new Date(ticket.checked_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    )
  }

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await fetch('/api/admin/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: ticket.id, type }),
          })
          router.refresh()
        })
      }}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-primary/15 text-brand-primary hover:bg-brand-primary/25 transition-all disabled:opacity-50"
    >
      <Clock size={11} />
      {isPending ? 'Checking…' : 'Check In'}
    </button>
  )
}

export default function EventAttendeesClient({ event, tickets }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets
    const q = search.toLowerCase()
    return tickets.filter(t =>
      (t.guest_name  ?? '').toLowerCase().includes(q) ||
      (t.guest_email ?? '').toLowerCase().includes(q)
    )
  }, [tickets, search])

  const totalRevenue  = tickets.reduce((sum, t) => sum + (t.amount_paid ?? 0), 0)
  const checkedInCount = tickets.filter(t => t.checked_in).length
  const fillPct       = event.capacity > 0 ? (event.tickets_sold / event.capacity) * 100 : 0

  return (
    <>
      {/* Back link */}
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Events
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">{event.title}</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {event.location && ` · ${event.location}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(buildCSV(event, tickets), `attendees-${event.id}.csv`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <a
            href={`/api/admin/pdf/events/${event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary/15 hover:bg-brand-primary/25 text-brand-primary text-sm font-medium transition-all"
          >
            <FileText size={14} />
            Export PDF with QR Codes
          </a>
        </div>
      </div>

      {/* Capacity progress bar */}
      <div className="glass-card rounded-2xl p-5 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/60 text-sm font-medium">Capacity</span>
          <span className="text-white font-bold text-sm">{event.tickets_sold} / {event.capacity} seats</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(fillPct, 100)}%`,
              backgroundColor: fillPct >= 80 ? '#2ECC71' : '#E91E8C',
            }}
          />
        </div>
        <p className="text-white/30 text-xs mt-1.5">{fillPct.toFixed(0)}% full</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold font-heading text-white">{tickets.length}</p>
          <p className="text-white/40 text-xs mt-0.5">Total Attendees</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold font-heading text-green-400">€{totalRevenue.toFixed(2)}</p>
          <p className="text-white/40 text-xs mt-0.5">Total Revenue</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold font-heading text-brand-primary">{checkedInCount}</p>
          <p className="text-white/40 text-xs mt-0.5">Checked In</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-8 pr-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-white/10">
                {['#', 'Name', 'Email', 'Phone', 'Amount', 'Booking Ref', 'Status', 'Check-in'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-white/30 text-sm">No results</td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-sm text-white/30">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-white/80 whitespace-nowrap">{t.guest_name ?? 'Member'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{t.guest_email ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{t.guest_phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      {t.amount_paid != null
                        ? <span className="font-mono font-semibold text-green-400">€{t.amount_paid.toFixed(2)}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs tracking-widest text-white/60">{t.booking_ref}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[t.status] ?? 'bg-white/10 text-white/40'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CheckInButton ticket={t} type="event" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/5 text-white/25 text-xs">
          {filtered.length} {filtered.length === 1 ? 'attendee' : 'attendees'}
          {search && ` (filtered from ${tickets.length})`}
        </div>
      </div>
    </>
  )
}
