'use client'

import { useState, useMemo, useTransition } from'react'
import { useRouter } from'next/navigation'
import { ArrowLeft, Download, FileText, Search, CheckCircle, Clock } from'lucide-react'
import Link from'next/link'

type TripBooking = {
  id: string
  booking_ref: string
  status: string
  tier: string
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  amount_paid: number | null
  quantity: number
  qr_code: string | null
  created_at: string
  checked_in: boolean | null
  checked_in_at: string | null
}

type TripInfo = {
  id: string
  title: string
  start_date: string
  capacity: number
  seats_sold: number
  destination: string
}

interface Props {
  trip: TripInfo
  bookings: TripBooking[]
}

const STATUS_COLORS: Record<string, string> = {
  pending:'bg-blue-500/15 text-blue-400',
  confirmed:'bg-green-500/15 text-green-400',
  cancelled:'bg-red-500/15 text-red-400',
  refunded:'bg-orange-500/15 text-orange-400',
}

function TierBadge({ tier }: { tier: string }) {
  const label = tier ==='early_bird' ?' Early Bird' : tier ==='group' ?' Group' :' Standard'
  const style = {
    padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight: 700,
    background: tier ==='early_bird' ?'#FF6B00' : tier ==='group' ?'#2ECC71' :'rgba(255,255,255,0.1)',
    color: tier ==='early_bird' || tier ==='group' ?'#0D0D0D' :'#ffffff',
  }
  return <span style={style}>{label}</span>
}

function buildCSV(trip: TripInfo, rows: TripBooking[]): string {
  const headers = ['#','Name','Email','Phone','Tier','Qty','Booking Ref','QR Code','Status','Amount','Checked In','Check-in Time','Booked At']
  const lines = [
    headers.join(','),
    ...rows.map((b, i) => [
      i + 1,
      b.guest_name ??'Member',
      b.guest_email ??'',
      b.guest_phone ??'',
      b.tier,
      b.quantity,
      b.booking_ref,
      b.qr_code ??'',
      b.status,
      b.amount_paid != null ?`€${b.amount_paid.toFixed(2)}` :'',
      b.checked_in ?'Yes' :'No',
      b.checked_in_at ? new Date(b.checked_in_at).toLocaleString('en-GB') :'',
      new Date(b.created_at).toLocaleString('en-GB'),
    ].join(',')),
  ]
  return lines.join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function CheckInButton({ booking }: { booking: TripBooking }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (booking.checked_in) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
          <CheckCircle size={12} /> Checked in
        </span>
        {booking.checked_in_at && (
          <span className="text-white/25 text-xs">
            {new Date(booking.checked_in_at).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
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
            method:'POST',
            headers: {'Content-Type':'application/json' },
            body: JSON.stringify({ bookingId: booking.id, type:'trip' }),
          })
          router.refresh()
        })
      }}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-primary/15 text-brand-primary hover:bg-brand-primary/25 transition-all disabled:opacity-50"
    >
      <Clock size={11} />
      {isPending ?'Checking…' :'Check In'}
    </button>
  )
}

export default function TripAttendeesClient({ trip, bookings }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings
    const q = search.toLowerCase()
    return bookings.filter(b =>
      (b.guest_name ??'').toLowerCase().includes(q) ||
      (b.guest_email ??'').toLowerCase().includes(q)
    )
  }, [bookings, search])

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount_paid ?? 0), 0)
  const checkedInCount = bookings.filter(b => b.checked_in).length
  const fillPct = trip.capacity > 0 ? (trip.seats_sold / trip.capacity) * 100 : 0

  // Tier breakdown
  const tiers = ['early_bird','standard','group'] as const
  const tierStats = tiers.map(tier => ({
    tier,
    count: bookings.filter(b => b.tier === tier).length,
    revenue: bookings.filter(b => b.tier === tier).reduce((s, b) => s + (b.amount_paid ?? 0), 0),
  })).filter(t => t.count > 0)

  return (
    <>
      {/* Back link */}
      <Link
        href="/admin/trips"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Trips
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">{trip.title}</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {new Date(trip.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
            {` · ${trip.destination}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(buildCSV(trip, bookings),`attendees-trip-${trip.id}.csv`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <a
            href={`/api/admin/pdf/trips/${trip.id}`}
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
          <span className="text-white font-bold text-sm">{trip.seats_sold} / {trip.capacity} seats</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width:`${Math.min(fillPct, 100)}%`,
              backgroundColor: fillPct >= 80 ?'#2ECC71' :'#E91E8C',
            }}
          />
        </div>
        <p className="text-white/30 text-xs mt-1.5">{fillPct.toFixed(0)}% full</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold font-heading text-white">{bookings.length}</p>
          <p className="text-white/40 text-xs mt-0.5">Total Bookings</p>
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

      {/* Tier breakdown */}
      {tierStats.length > 0 && (
        <div className="glass-card rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Tier Breakdown</p>
          <div className="flex flex-wrap gap-4">
            {tierStats.map(t => (
              <div key={t.tier} className="flex items-center gap-3">
                <TierBadge tier={t.tier} />
                <span className="text-white/70 text-sm">{t.count} booking{t.count !== 1 ?'s' :''}</span>
                <span className="text-green-400 font-mono text-sm">€{t.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {['#','Name','Email','Phone','Tier','Qty','Amount','Booking Ref','Status','Check-in'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-white/30 text-sm">No results</td>
                </tr>
              ) : (
                filtered.map((b, i) => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-sm text-white/30">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-white/80 whitespace-nowrap">{b.guest_name ??'Member'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{b.guest_email ??'—'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{b.guest_phone ??'—'}</td>
                    <td className="px-4 py-3"><TierBadge tier={b.tier} /></td>
                    <td className="px-4 py-3 text-sm text-white/70">{b.quantity > 1 ?`${b.quantity}×` :'1'}</td>
                    <td className="px-4 py-3 text-sm">
                      {b.amount_paid != null
                        ? <span className="font-mono font-semibold text-green-400">€{b.amount_paid.toFixed(2)}</span>
                        :'—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs tracking-widest text-white/60">{b.booking_ref}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status] ??'bg-white/10 text-white/40'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CheckInButton booking={b} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/5 text-white/25 text-xs">
          {filtered.length} {filtered.length === 1 ?'booking' :'bookings'}
          {search &&` (filtered from ${bookings.length})`}
        </div>
      </div>
    </>
  )
}
