'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, QrCode, Ticket, X, QrCode as QrIcon, Printer } from 'lucide-react'
import DataTable from '@/components/admin/DataTable'
import type { Column } from '@/components/admin/DataTable'

type BookingType = 'Event' | 'Trip'

export interface BookingExtra {
  id:          string
  name:        string
  price:       number
  description: string
}

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
  quantity:          number
  qr_code:           string | null
  group_booking_ref: string | null
  is_group_booking:  boolean
  lead_name:         string | null
  lead_email:        string | null
  referral_code:     string | null
  ticket_tier_name:  string | null
  promo_code_used:   string | null
  selected_extras:   BookingExtra[] | null
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
  const headers = ['Type', 'Booking Ref', 'Guest Name', 'Guest Email', 'Title', 'Date', 'Status', 'Amount', 'Created At', 'Group Ref', 'Lead Name', 'Lead Email']
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
      b.group_booking_ref ?? '',
      b.lead_name         ?? '',
      b.lead_email        ?? '',
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

const EVENT_STATUSES  = ['active', 'used', 'cancelled', 'refunded']
const TRIP_STATUSES   = ['pending', 'confirmed', 'cancelled', 'refunded']

function TierBadge({ tier }: { tier: string }) {
  const label = tier === 'early_bird' ? '🔥 Early Bird' : tier === 'group' ? '👥 Group' : '💰 Standard'
  const style = {
    padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
    background: tier === 'early_bird' ? '#F5A623' : tier === 'group' ? '#2ECC71' : 'rgba(255,255,255,0.1)',
    color: tier === 'early_bird' || tier === 'group' ? '#1A1A2E' : '#ffffff',
  }
  return <span style={style}>{label}</span>
}

function BookingDetailModal({
  booking,
  allBookings,
  onClose,
  onStatusChange,
}: {
  booking: Booking
  allBookings: Booking[]
  onClose: () => void
  onStatusChange: (status: string) => void
}) {
  const [changing, setChanging] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(booking.status)
  const statuses = booking.type === 'Event' ? EVENT_STATUSES : TRIP_STATUSES

  async function changeStatus(newStatus: string) {
    if (newStatus === currentStatus) return
    setChanging(true)
    const res = await fetch(`/api/admin/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: booking.type === 'Event' ? 'event' : 'trip', status: newStatus }),
    })
    setChanging(false)
    if (res.ok) {
      setCurrentStatus(newStatus)
      onStatusChange(newStatus)
    }
  }

  async function handleRefund() {
    setChanging(true)
    const res = await fetch('/api/admin/refund-booking', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookingId: booking.id, type: booking.type === 'Event' ? 'event' : 'trip' }),
    })
    setChanging(false)
    if (res.ok) {
      setCurrentStatus('refunded')
      onStatusChange('refunded')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              booking.type === 'Event'
                ? 'bg-brand-primary/15 text-brand-primary'
                : 'bg-cyan-500/15 text-cyan-400'
            }`}>
              {booking.type}
            </span>
            <h2 className="font-heading text-xl font-bold text-white mt-2">{booking.title}</h2>
            {booking.location && (
              <p className="text-white/40 text-sm">{booking.location}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column — details */}
          <div className="flex flex-col gap-5">
            {/* Guest */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">Guest</p>
              <div className="flex flex-col gap-1">
                <p className="text-white font-medium">{booking.guest_name ?? 'Member (logged in)'}</p>
                {booking.guest_email && (
                  <p className="text-white/50 text-sm">{booking.guest_email}</p>
                )}
                {booking.guest_phone && (
                  <p className="text-white/50 text-sm">{booking.guest_phone}</p>
                )}
              </div>
            </div>

            {/* Event / Trip */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">Event / Trip</p>
              <div className="flex flex-col gap-1">
                <p className="text-white/80 text-sm">{booking.title}</p>
                {booking.date && (
                  <p className="text-white/50 text-sm">
                    {new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {/* Booking details */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">Booking</p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-white/40 text-sm">Reference</span>
                  <span className="font-mono text-sm tracking-widest text-white/70">{booking.booking_ref}</span>
                </div>
                {/* Trip tier */}
                {booking.tier && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Tier</span>
                    <TierBadge tier={booking.tier} />
                  </div>
                )}
                {/* Event ticket tier */}
                {booking.ticket_tier_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Ticket tier</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                      {booking.ticket_tier_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/40 text-sm">Quantity</span>
                  <span className="text-white/80 text-sm">{booking.quantity > 1 ? `${booking.quantity} people` : '1 person'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 text-sm">Amount paid</span>
                  <span className="font-mono font-semibold text-green-400">
                    {booking.price != null ? `€${booking.price.toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 text-sm">Booked at</span>
                  <span className="text-white/60 text-sm">
                    {new Date(booking.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {/* Promo code */}
                {booking.promo_code_used && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Promo code</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-accent/15 text-brand-accent tracking-widest">
                      {booking.promo_code_used}
                    </span>
                  </div>
                )}
                {/* Referral code */}
                {booking.referral_code && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Referral code</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 tracking-widest">
                      {booking.referral_code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Add-ons (trips only) */}
            {booking.selected_extras && booking.selected_extras.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">Add-ons</p>
                <div className="flex flex-col gap-1.5">
                  {booking.selected_extras.map(extra => (
                    <div key={extra.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                      <div>
                        <p className="text-white/80 text-sm font-medium">{extra.name}</p>
                        {extra.description && (
                          <p className="text-white/35 text-xs">{extra.description}</p>
                        )}
                      </div>
                      <span className="font-mono text-sm font-semibold text-brand-accent ml-3 shrink-0">
                        +€{extra.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group booking */}
            {booking.is_group_booking && (() => {
              const siblings = allBookings.filter(
                b => b.group_booking_ref && b.group_booking_ref === booking.group_booking_ref
              )
              return (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">Group Booking</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-white/40 text-sm">Group ref</span>
                      <span className="font-mono text-xs tracking-widest text-white/70">{booking.group_booking_ref}</span>
                    </div>
                    {booking.lead_name && (
                      <div className="flex justify-between">
                        <span className="text-white/40 text-sm">Lead booker</span>
                        <div className="text-right">
                          <p className="text-white/70 text-sm">{booking.lead_name}</p>
                          {booking.lead_email && <p className="text-white/40 text-xs">{booking.lead_email}</p>}
                        </div>
                      </div>
                    )}
                    {siblings.length > 0 && (
                      <div>
                        <p className="text-white/40 text-xs mb-1.5">All tickets ({siblings.length})</p>
                        <div className="flex flex-col gap-1">
                          {siblings.map((s, idx) => (
                            <div key={s.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${s.id === booking.id ? 'bg-brand-primary/10 border border-brand-primary/20' : 'bg-white/3'}`}>
                              <span className="text-white/30 font-mono w-5 text-center">{idx + 1}</span>
                              <span className="text-white/70 flex-1">{s.guest_name ?? 'Unknown'}</span>
                              {s.guest_email && <span className="text-white/30 truncate max-w-[120px]">{s.guest_email}</span>}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${STATUS_COLORS[s.status] ?? 'bg-white/10 text-white/40'}`}>{s.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Status */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map(s => (
                  <button
                    key={s}
                    disabled={changing}
                    onClick={() => changeStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                      currentStatus === s
                        ? `${STATUS_COLORS[s] ?? 'bg-white/10 text-white/40'} border-current`
                        : 'bg-transparent text-white/30 border-white/10 hover:border-white/30 hover:text-white/60'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Issue Refund */}
            {(currentStatus === 'confirmed' || currentStatus === 'active') && (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleRefund}
                  disabled={changing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-sm font-medium transition-all disabled:opacity-50"
                >
                  Issue Refund
                </button>
                <p className="text-white/30 text-xs mt-2">Processes a full Stripe refund and sends the student a refund email.</p>
              </div>
            )}
          </div>

          {/* Right column — QR code */}
          <div className="flex flex-col items-center justify-start gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 self-start">QR Code</p>
            {booking.qr_code ? (
              <div className="bg-white p-3 rounded-xl">
                <img
                  src={booking.qr_code}
                  alt={`QR code for ${booking.booking_ref}`}
                  className="w-48 h-48 object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 text-white/20">
                <QrIcon size={48} />
                <p className="text-xs">No QR code</p>
              </div>
            )}
            <p className="text-white/30 text-xs font-mono">{booking.booking_ref}</p>
            <a
              href={`/api/admin/pdf/ticket/${booking.id}?type=${booking.type === 'Event' ? 'event' : 'trip'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 text-white/50 hover:text-white hover:border-white/30 text-xs font-medium transition-all"
            >
              <Printer size={12} />
              Reprint Ticket
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingsClient({ bookings }: Props) {
  const router = useRouter()
  const [tab,      setTab]      = useState<FilterTab>('all')
  const [selected, setSelected] = useState<Booking | null>(null)

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
        <div>
          <span className="font-mono text-xs tracking-widest text-white/70">{r.booking_ref}</span>
          {r.is_group_booking && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-primary align-middle">
              👥 GROUP
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'guest_name', header: 'Name',
      render: (r) => (
        <div>
          <span className="text-white/80">{r.guest_name ?? 'Member'}</span>
          {r.is_group_booking && r.lead_name && r.lead_name !== r.guest_name && (
            <p className="text-white/30 text-xs">via {r.lead_name}</p>
          )}
        </div>
      ),
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
      key: 'tier', header: 'Tier',
      render: (r) => r.tier ? <TierBadge tier={r.tier} /> : '—',
    },
    {
      key: 'quantity', header: 'Qty',
      render: (r) => r.quantity > 1 ? `${r.quantity} people` : '1',
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
        <span className="font-mono text-sm font-semibold text-green-400">€{r.price.toFixed(2)}</span>
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
          <Link
            href="/scanner"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all"
          >
            <QrCode size={14} />
            <span>QR Scanner</span>
          </Link>
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
          onRowClick={(row) => setSelected(row as unknown as Booking)}
        />
      )}

      {selected && (
        <BookingDetailModal
          booking={selected}
          allBookings={bookings}
          onClose={() => setSelected(null)}
          onStatusChange={(status) => {
            setSelected(prev => prev ? { ...prev, status } : null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
