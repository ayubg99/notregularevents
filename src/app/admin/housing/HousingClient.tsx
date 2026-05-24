'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { updateHousingStatus, deleteHousing } from '@/app/actions/admin'
import type { HousingListingRow, HousingStatus } from '@/types/database'

const STATUS_COLORS: Record<HousingStatus, string> = {
  active:   'text-green-400 bg-green-400/10 border border-green-400/20',
  inactive: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  rented:   'text-blue-400 bg-blue-400/10 border border-blue-400/20',
}

const TYPE_LABELS: Record<string, string> = {
  room_available:   'Room Available',
  looking_for_room: 'Looking',
}

const STATUS_TABS: Array<{ label: string; value: HousingStatus | 'all' }> = [
  { label: 'All',      value: 'all'      },
  { label: 'Active',   value: 'active'   },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Rented',   value: 'rented'   },
]

interface Props { listings: HousingListingRow[] }

export default function HousingClient({ listings }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<HousingStatus | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = statusFilter === 'all'
    ? listings
    : listings.filter(l => l.status === statusFilter)

  function handleDeactivate(id: string) {
    startTransition(async () => {
      await updateHousingStatus(id, 'inactive')
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteHousing(id)
      setConfirmDelete(null)
      router.refresh()
    })
  }

  const columns: Column<HousingListingRow>[] = [
    {
      key: 'type',
      header: 'Type',
      render: r => (
        <span className="text-xs font-medium text-white/70">
          {TYPE_LABELS[r.type] ?? r.type}
        </span>
      ),
    },
    { key: 'title', header: 'Title', sortable: true },
    {
      key: 'neighborhood',
      header: 'Area',
      render: r => <span className="text-white/60">{r.neighborhood ?? '—'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: r => <span className="text-white/60">{r.price ? `€${r.price}` : '—'}</span>,
    },
    { key: 'contact_name', header: 'Contact', sortable: true },
    {
      key: 'contact_whatsapp',
      header: 'WhatsApp',
      render: r => r.contact_whatsapp
        ? <a href={`https://wa.me/${r.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline text-xs">{r.contact_whatsapp}</a>
        : <span className="text-white/30">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: r => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires',
      render: r => (
        <span className="text-white/40 text-xs">
          {new Date(r.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      sortable: true,
      render: r => <span className="text-white/40 text-xs">{r.views}</span>,
    },
  ]

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? 'bg-brand-primary text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">
              {tab.value === 'all' ? listings.length : listings.filter(l => l.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchKeys={['title', 'contact_name', 'neighborhood']}
        actions={row => (
          <div className="flex gap-2">
            {row.status === 'active' && (
              <button
                onClick={() => handleDeactivate(row.id)}
                disabled={isPending}
                className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-40"
              >
                Deactivate
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(row.id)}
              disabled={isPending}
              className="text-xs px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        )}
      />

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <p className="text-white font-semibold mb-2">Delete this listing?</p>
            <p className="text-white/50 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/10 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={isPending}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
