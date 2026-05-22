'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react'
import DataTable from '@/components/admin/DataTable'
import { createTrip, updateTrip, deleteTrip } from '@/app/actions/admin'
import type { TripRow, TripInsert, TripStatus } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500/15 text-green-400',
  draft:     'bg-white/10 text-white/40',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-blue-500/15 text-blue-400',
}

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface FormState {
  title:            string
  slug:             string
  description:      string
  destination:      string
  start_date:       string
  end_date:         string
  price_standard:   string
  price_early_bird: string
  price_vip:        string
  price_group:      string
  capacity:         string
  image_url:        string
  status:           TripStatus
}

const defaultForm = (): FormState => ({
  title: '', slug: '', description: '', destination: '',
  start_date: '', end_date: '',
  price_standard: '', price_early_bird: '', price_vip: '', price_group: '',
  capacity: '50', image_url: '', status: 'draft',
})

interface Props { initialTrips: TripRow[] }

export default function TripsManager({ initialTrips }: Props) {
  const router = useRouter()
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<TripRow | null>(null)
  const [form,    setForm]    = useState<FormState>(defaultForm())
  const [error,   setError]   = useState('')
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null); setForm(defaultForm()); setError(''); setModal('create')
  }

  function openEdit(trip: TripRow) {
    setEditing(trip)
    setForm({
      title:            trip.title,
      slug:             trip.slug,
      description:      trip.description ?? '',
      destination:      trip.destination,
      start_date:       trip.start_date.slice(0, 10),
      end_date:         trip.end_date.slice(0, 10),
      price_standard:   String(trip.price_standard),
      price_early_bird: trip.price_early_bird != null ? String(trip.price_early_bird) : '',
      price_vip:        trip.price_vip != null ? String(trip.price_vip) : '',
      price_group:      trip.price_group != null ? String(trip.price_group) : '',
      capacity:         String(trip.capacity),
      image_url:        trip.image_url ?? '',
      status:           trip.status,
    })
    setError(''); setModal('edit')
  }

  function parseOptional(val: string): number | null {
    return val.trim() ? parseFloat(val) : null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    startTransition(async () => {
      const data: TripInsert = {
        title:            form.title,
        slug:             form.slug || toSlug(form.title),
        description:      form.description || null,
        destination:      form.destination,
        start_date:       form.start_date,
        end_date:         form.end_date,
        price_standard:   parseFloat(form.price_standard) || 0,
        price_early_bird: parseOptional(form.price_early_bird),
        price_vip:        parseOptional(form.price_vip),
        price_group:      parseOptional(form.price_group),
        capacity:         parseInt(form.capacity) || 50,
        image_url:        form.image_url || null,
        status:           form.status,
        category:         null,
        itinerary:        null,
        whats_included:   null,
        whats_excluded:   null,
        meeting_points:   null,
        whatsapp_group_url: null,
        created_by:         null,  // server action injects the actual userId
      }
      const result = modal === 'edit' && editing
        ? await updateTrip(editing.id, data)
        : await createTrip(data)

      if (result.success) { setModal(null); router.refresh() }
      else setError(result.error ?? 'Failed to save trip.')
    })
  }

  function handleToggleStatus(trip: TripRow) {
    startTransition(async () => {
      await updateTrip(trip.id, { status: trip.status === 'published' ? 'draft' : 'published' })
      router.refresh()
    })
  }

  function handleDelete(trip: TripRow) {
    if (!confirm(`Delete "${trip.title}"? This cannot be undone.`)) return
    startTransition(async () => { await deleteTrip(trip.id); router.refresh() })
  }

  type TripTableRow = TripRow & Record<string, unknown>

  const columns = [
    { key: 'title',       header: 'Title',       sortable: true },
    { key: 'destination', header: 'Destination', sortable: true },
    { key: 'start_date',  header: 'Dates',       sortable: true,
      render: (row: TripTableRow) => `${new Date(row.start_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(row.end_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` },
    { key: 'capacity', header: 'Seats',
      render: (row: TripTableRow) => `${row.seats_sold as number} / ${row.capacity as number}` },
    { key: 'price_standard', header: 'From',
      render: (row: TripTableRow) => `€${row.price_standard as number}` },
    { key: 'status', header: 'Status',
      render: (row: TripTableRow) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[row.status as string] ?? ''}`}>
          {row.status as string}
        </span>
      )},
  ]

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Trips</h1>
          <p className="text-white/40 text-sm mt-0.5">{initialTrips.length} total trips</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:brightness-110 text-white text-sm font-semibold transition-all">
          <Plus size={15} /> New Trip
        </button>
      </div>

      <DataTable
        data={initialTrips as unknown as TripTableRow[]}
        columns={columns}
        searchKeys={['title', 'destination', 'status'] as (keyof TripTableRow)[]}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button onClick={() => handleToggleStatus(row as unknown as TripRow)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title={row.status === 'published' ? 'Unpublish' : 'Publish'}>
              {row.status === 'published' ? <ToggleRight size={15} className="text-green-400" /> : <ToggleLeft size={15} />}
            </button>
            <button onClick={() => openEdit(row as unknown as TripRow)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
            <button onClick={() => handleDelete(row as unknown as TripRow)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
          </div>
        )}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-brand-dark border border-white/15 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-heading font-bold text-white text-lg">{modal === 'create' ? 'New Trip' : 'Edit Trip'}</h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: toSlug(e.target.value) }))} required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Destination *</label>
                  <input type="text" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required className={inputClass} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TripStatus }))} className={`${inputClass} appearance-none [&>option]:bg-brand-dark`}>
                    {['draft','published','cancelled','completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required className={inputClass} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">End Date *</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Standard Price (€) *</label>
                  <input type="number" min="0" step="0.01" value={form.price_standard} onChange={e => setForm(f => ({ ...f, price_standard: e.target.value }))} required className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Early Bird (€)</label>
                  <input type="number" min="0" step="0.01" value={form.price_early_bird} onChange={e => setForm(f => ({ ...f, price_early_bird: e.target.value }))} className={inputClass} placeholder="optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">VIP Price (€)</label>
                  <input type="number" min="0" step="0.01" value={form.price_vip} onChange={e => setForm(f => ({ ...f, price_vip: e.target.value }))} className={inputClass} placeholder="optional" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Group Price (€)</label>
                  <input type="number" min="0" step="0.01" value={form.price_group} onChange={e => setForm(f => ({ ...f, price_group: e.target.value }))} className={inputClass} placeholder="optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Capacity</label>
                  <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Image URL</label>
                  <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className={inputClass} placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} resize-none`} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-brand-primary hover:brightness-110 text-white text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (modal === 'create' ? 'Create Trip' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
