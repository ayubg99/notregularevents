'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmBookingAdmin, rejectBookingAdmin } from '@/app/actions/admin'
import type { RoomContactStatus } from '@/types/database'

const STATUS_COLORS: Record<RoomContactStatus, string> = {
  pending:        'text-orange-400 bg-orange-400/10 border-orange-400/20',
  confirmed:      'text-green-400 bg-green-400/10 border-green-400/20',
  contact_shared: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  rejected:       'text-red-400 bg-red-400/10 border-red-400/20',
  refunded:       'text-red-400 bg-red-400/10 border-red-400/20',
  cancelled:      'text-white/40 bg-white/5 border-white/10',
}

const STATUS_LABELS: Record<RoomContactStatus, string> = {
  pending:        'Pending',
  confirmed:      'Confirmed',
  contact_shared: 'Contact shared',
  rejected:       'Rejected',
  refunded:       'Refunded',
  cancelled:      'Cancelled',
}

export type ContactRow = {
  id:              string
  booking_ref:     string
  guest_name:      string
  guest_email:     string
  guest_nationality: string | null
  move_in_date:    string | null
  duration_months: number
  platform_fee:    number
  created_at:      string
  status:          RoomContactStatus
  partner_rooms:   { title: string; neighborhood: string; monthly_rent: number } | null
  housing_partners: { name: string } | null
}

export default function ContactsClient({ rows }: { rows: ContactRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [activeRef, setActiveRef] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleConfirm(bookingRef: string) {
    setActiveRef(bookingRef)
    startTransition(async () => {
      const res = await confirmBookingAdmin(bookingRef)
      setActiveRef(null)
      if (res.success) {
        showToast('Booking confirmed — contact email sent to student')
        router.refresh()
      } else {
        showToast(`Error: ${res.error ?? 'Unknown error'}`)
      }
    })
  }

  function handleReject(bookingRef: string) {
    setActiveRef(bookingRef)
    startTransition(async () => {
      const res = await rejectBookingAdmin(bookingRef)
      setActiveRef(null)
      if (res.success) {
        showToast('Booking rejected — full refund issued to student')
        router.refresh()
      } else {
        showToast(`Error: ${res.error ?? 'Unknown error'}`)
      }
    })
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden relative">
      {toast && (
        <div className="absolute top-4 right-4 z-10 bg-brand-accent text-black text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="p-12 text-center text-white/40">No contacts sold yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 text-xs px-5 py-3">Ref</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Room</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Guest</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Nationality</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Move-in</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Duration</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Fee</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Date</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Status</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3 text-white/60 text-xs font-mono">{c.booking_ref}</td>
                  <td className="px-5 py-3">
                    <p className="text-white text-sm">{c.partner_rooms?.title ?? '—'}</p>
                    <p className="text-white/40 text-xs">{c.partner_rooms?.neighborhood} · {c.housing_partners?.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-white text-sm">{c.guest_name}</p>
                    <p className="text-white/40 text-xs">{c.guest_email}</p>
                  </td>
                  <td className="px-5 py-3 text-white/60 text-sm">{c.guest_nationality ?? '—'}</td>
                  <td className="px-5 py-3 text-white/60 text-sm">
                    {c.move_in_date
                      ? new Date(c.move_in_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-white/60 text-sm">{c.duration_months}mo</td>
                  <td className="px-5 py-3 text-brand-accent text-sm font-medium">€{c.platform_fee}</td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {c.status === 'pending' ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleConfirm(c.booking_ref)}
                          disabled={pending && activeRef === c.booking_ref}
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleReject(c.booking_ref)}
                          disabled={pending && activeRef === c.booking_ref}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
