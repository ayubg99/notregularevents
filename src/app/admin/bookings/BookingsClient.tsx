'use client'

import { useState } from 'react'
import { Download, QrCode } from 'lucide-react'
import DataTable from '@/components/admin/DataTable'
import type { EventTicketRow, TripBookingRow } from '@/types/database'

type TicketRow = EventTicketRow & {
  events: { title: string; date: string } | null
  users:  { email: string; full_name: string | null } | null
} & Record<string, unknown>

type TripRow = TripBookingRow & {
  trips: { title: string; start_date: string } | null
  users: { email: string; full_name: string | null } | null
} & Record<string, unknown>

interface Props {
  eventTickets: TicketRow[]
  tripBookings: TripRow[]
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/15 text-green-400',
  confirmed: 'bg-green-500/15 text-green-400',
  used:      'bg-white/10 text-white/40',
  cancelled: 'bg-red-500/15 text-red-400',
  refunded:  'bg-yellow-500/15 text-yellow-400',
  pending:   'bg-blue-500/15 text-blue-400',
}

function buildCSV(rows: Record<string, unknown>[], headers: string[], keys: string[]): string {
  const lines = [
    headers.join(','),
    ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
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

export default function BookingsClient({ eventTickets, tripBookings }: Props) {
  const [tab, setTab] = useState<'events' | 'trips'>('events')

  const ticketColumns = [
    { key: 'event_title', header: 'Event', sortable: true,
      render: (r: TicketRow) => r.events?.title ?? '—' },
    { key: 'user_email', header: 'User',
      render: (r: TicketRow) => r.users?.email ?? '—' },
    { key: 'booking_ref', header: 'Ref', sortable: true,
      render: (r: TicketRow) => <span className="font-mono text-xs tracking-widest">{r.booking_ref}</span> },
    { key: 'status', header: 'Status',
      render: (r: TicketRow) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      )},
    { key: 'created_at', header: 'Booked', sortable: true,
      render: (r: TicketRow) => new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
  ]

  const tripColumns = [
    { key: 'trip_title', header: 'Trip', sortable: true,
      render: (r: TripRow) => r.trips?.title ?? '—' },
    { key: 'user_email', header: 'User',
      render: (r: TripRow) => r.users?.email ?? '—' },
    { key: 'booking_ref', header: 'Ref', sortable: true,
      render: (r: TripRow) => <span className="font-mono text-xs tracking-widest">{r.booking_ref}</span> },
    { key: 'tier', header: 'Tier',
      render: (r: TripRow) => <span className="capitalize text-xs">{r.tier}</span> },
    { key: 'status', header: 'Status',
      render: (r: TripRow) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      )},
    { key: 'created_at', header: 'Booked', sortable: true,
      render: (r: TripRow) => new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
  ]

  function exportEventTickets() {
    const csv = buildCSV(
      eventTickets as unknown as Record<string, unknown>[],
      ['Booking Ref', 'Event', 'User Email', 'User Name', 'Status', 'Stripe ID', 'Booked At'],
      ['booking_ref', 'event_title', 'user_email', 'user_name', 'status', 'stripe_payment_id', 'created_at'],
    )
    downloadCSV(csv, 'event-tickets.csv')
  }

  function exportTripBookings() {
    const csv = buildCSV(
      tripBookings as unknown as Record<string, unknown>[],
      ['Booking Ref', 'Trip', 'User Email', 'User Name', 'Tier', 'Status', 'Stripe ID', 'Booked At'],
      ['booking_ref', 'trip_title', 'user_email', 'user_name', 'tier', 'status', 'stripe_payment_id', 'created_at'],
    )
    downloadCSV(csv, 'trip-bookings.csv')
  }

  const ticketData = eventTickets.map(t => ({
    ...t,
    event_title: t.events?.title ?? '',
    user_email:  t.users?.email ?? '',
    user_name:   t.users?.full_name ?? '',
  })) as unknown as TicketRow[]

  const tripData = tripBookings.map(t => ({
    ...t,
    trip_title: t.trips?.title ?? '',
    user_email: t.users?.email ?? '',
    user_name:  t.users?.full_name ?? '',
  })) as unknown as TripRow[]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Bookings</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {eventTickets.length} event tickets · {tripBookings.length} trip bookings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={tab === 'events' ? exportEventTickets : exportTripBookings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm cursor-default">
            <QrCode size={14} />
            <span>QR Scanner</span>
            <span className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-white/25">soon</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/5 border border-white/10 p-1 w-fit mb-5">
        {(['events', 'trips'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 capitalize ${
              tab === t ? 'bg-brand-primary text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'events' ? (
        <DataTable
          data={ticketData}
          columns={ticketColumns}
          searchKeys={['booking_ref', 'event_title', 'user_email'] as (keyof TicketRow)[]}
        />
      ) : (
        <DataTable
          data={tripData}
          columns={tripColumns}
          searchKeys={['booking_ref', 'trip_title', 'user_email'] as (keyof TripRow)[]}
        />
      )}
    </>
  )
}
