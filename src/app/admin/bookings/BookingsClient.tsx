'use client'

import { useState, useMemo } from 'react'
import { Download, QrCode, Ticket } from 'lucide-react'
import DataTable from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'

type BookingType = 'Event' | 'Trip'

export interface Booking {
  id:                string
  type:              BookingType
  booking_ref:       string
  status:            string
  created_at:        string
  guest_name:        string | null
  guest_email:       string | null
  guest_phone:       string | null
  stripe_payment_id: string | null
  title:             string
  date:              string | null
  price:             number | null
  location:          string | null
  tier:              string | null
}

type BookingRow = Booking & Record<string, unknown>

interface Props {
  bookings: Booking[]
}

type FilterTab = 'all' | 'events' | 'trips' | 'today' | 'week'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/15 text-green-400',
  confirmed: 'bg-green-500/15 text-green-400',
  used:      'bg-white/10 text-white/40',
  cancelled: 'bg-red-500/15 text-red-400',
  refunded:  'bg-yellow-500/15 text-yellow-400',
  pending:   'bg-blue-500/15 text-blue-400',
}

function buildCSV(rows: Booking[]): string {
  const headers = ['Type', 'Booking Ref', 'Guest Name', 'Guest Email', 'Title', 'Date', 'Status', 'Amount', 'Created At']
  const lines = [
    headers.join(','),
    ...rows.map(b => [
      b.type,
      b.booking_ref,
      b.guest_name  ?? 'Member',
      b.guest_email ?? '',
      `"${b.title.replace(/"/g, '""')}"`,
      b.date ? new Date(b.date).toLocaleDateString('en-GB') : '',
      b.status,
      b.price != null ? `€${b.price}` : '',
      new Date(b.created_at).toLocaleDateString('en-GB'),
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

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',    label: 'All Bookings' },
  { key: 'events', label: 'Events Only'  },
  { key: 'trips',  label: 'Trips Only'   },
  { key: 'today',  label: 'Today'        },
  { key: 'week',   label: 'This Week'    },
]

export default function BookingsClient({ bookings }: Props) {
  const [tab, setTab] = useState<FilterTab>('all')

  const filtered = useMemo(() => {
    const now   = new Date()
    const today = now.toISOString().slice(0, 10)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    return bookings.filter(b => {
      if (tab === 'events') return b.type === 'Event'
      if (tab === 'trips')  return b.type === 'Trip'
      if (tab === 'today')  return b.created_at.slice(0, 10) === today
      if (tab === 'week')   return b.created_at >= weekAgo
      return true
    })
  }, [bookings, tab])

  const columns: Column<BookingRow>[] = [
    {
      key: 'type', header: 'Type',
      render: (r) => (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          r.type === 'Event'
            ? 'bg-brand-primary/15 text-brand-primary'
            : 'bg-cyan-500/15 text-cyan-400'
        }`}>
          {r.type}
        </span>
      ),
    },
    {
      key: 'booking_ref', header: 'Ref', sortable: true,
      render: (r) => (
        <span className="font-mono text-xs tracking-widest text-white/70">{r.booking_ref}</span>
      ),
    },
    {
      key: 'guest_name', header: 'Name',
      render: (r) => <span className="text-white/80">{r.guest_name ?? 'Member'}</span>,
    },
    {
      key: 'guest_email', header: 'Email',
      render: (r) => <span className="text-white/50 text-xs">{r.guest_email ?? '—'}</span>,
    },
    {
      key: 'title', header: 'Event / Trip', sortable: true,
      render: (r) => (
        <div>
          <p className="text-white/80 text-sm font-medium truncate max-w-[200px]">{r.title}</p>
          {r.location && <p className="text-white/30 text-xs truncate max-w-[200px]">{r.location}</p>}
        </div>
      ),
    },
    {
      key: 'date', header: 'Date', sortable: true,
      render: (r) => r.date
        ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] ?? 'bg-white/10 text-white/40'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'price', header: 'Amount',
      render: (r) => r.price != null ? (
        <span className="font-mono text-sm text-white/70">€{r.price}</span>
      ) : '—',
    },
    {
      key: 'created_at', header: 'Booked', sortable: true,
      render: (r) => new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Bookings</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {bookings.length} total · {bookings.filter(b => b.type === 'Event').length} events · {bookings.filter(b => b.type === 'Trip').length} trips
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(buildCSV(filtered), 'erasmus-vibe-bookings.csv')}
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

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-white/5 border border-white/10 p-1 w-fit mb-5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              tab === t.key ? 'bg-brand-primary text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">
            <Ticket className="mx-auto text-white/20" size={48} />
          </div>
          <h3 className="font-heading text-lg font-bold text-white/40 mb-1">No bookings yet</h3>
          <p className="text-white/25 text-sm">Bookings will appear here after students make purchases.</p>
        </div>
      ) : (
        <DataTable
          data={filtered as unknown as BookingRow[]}
          columns={columns}
          searchKeys={['booking_ref', 'title', 'guest_name', 'guest_email'] as (keyof BookingRow)[]}
        />
      )}
    </>
  )
}
