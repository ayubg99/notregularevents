'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react'
import DataTable from '@/components/admin/DataTable'
import { createEvent, updateEvent, deleteEvent } from '@/app/actions/admin'
import type { EventRow, EventInsert, EventCategory, EventStatus } from '@/types/database'

const CATEGORIES: EventCategory[] = ['party', 'cultural', 'sport', 'networking', 'trip', 'other']
const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500/15 text-green-400',
  draft:     'bg-white/10 text-white/40',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-blue-500/15 text-blue-400',
}

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

type ModalMode = 'create' | 'edit'

interface FormState {
  title:       string
  slug:        string
  description: string
  category:    EventCategory
  date:        string
  location:    string
  image_url:   string
  price:       string
  capacity:    string
  status:      EventStatus
}

const defaultForm = (): FormState => ({
  title: '', slug: '', description: '', category: 'party',
  date: '', location: '', image_url: '', price: '', capacity: '100', status: 'draft',
})

interface Props { initialEvents: EventRow[] }

export default function EventsManager({ initialEvents }: Props) {
  const router = useRouter()
  const [modal,   setModal]   = useState<ModalMode | null>(null)
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [form,    setForm]    = useState<FormState>(defaultForm())
  const [error,   setError]   = useState('')
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setForm(defaultForm())
    setError('')
    setModal('create')
  }

  function openEdit(event: EventRow) {
    setEditing(event)
    setForm({
      title:       event.title,
      slug:        event.slug,
      description: event.description ?? '',
      category:    event.category,
      date:        event.date.slice(0, 16),
      location:    event.location ?? '',
      image_url:   event.image_url ?? '',
      price:       String(event.price),
      capacity:    String(event.capacity),
      status:      event.status,
    })
    setError('')
    setModal('edit')
  }

  function handleTitleChange(title: string) {
    setForm(f => ({ ...f, title, slug: toSlug(title) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const data: EventInsert = {
        title:       form.title,
        slug:        form.slug,
        description: form.description || null,
        category:    form.category,
        date:        form.date,
        location:    form.location || null,
        image_url:   form.image_url || null,
        price:       parseFloat(form.price) || 0,
        capacity:    parseInt(form.capacity) || 100,
        status:      form.status,
        created_by:  null,  // server action injects the actual userId
      }
      const result = modal === 'edit' && editing
        ? await updateEvent(editing.id, data)
        : await createEvent(data)

      if (result.success) {
        setModal(null)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to save event.')
      }
    })
  }

  function handleToggleStatus(event: EventRow) {
    startTransition(async () => {
      await updateEvent(event.id, {
        status: event.status === 'published' ? 'draft' : 'published',
      })
      router.refresh()
    })
  }

  function handleDelete(event: EventRow) {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteEvent(event.id)
      router.refresh()
    })
  }

  type EventTableRow = EventRow & Record<string, unknown>

  const columns = [
    { key: 'title',    header: 'Title',    sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'date',     header: 'Date',     sortable: true,
      render: (row: EventTableRow) => new Date(row.date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { key: 'capacity', header: 'Tickets',
      render: (row: EventTableRow) => `${row.tickets_sold as number} / ${row.capacity as number}` },
    { key: 'status', header: 'Status',
      render: (row: EventTableRow) => (
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
          <h1 className="font-heading text-2xl font-bold text-white">Events</h1>
          <p className="text-white/40 text-sm mt-0.5">{initialEvents.length} total events</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:brightness-110 text-white text-sm font-semibold transition-all"
        >
          <Plus size={15} />
          New Event
        </button>
      </div>

      <DataTable
        data={initialEvents as unknown as EventTableRow[]}
        columns={columns}
        searchKeys={['title', 'category', 'status'] as (keyof EventTableRow)[]}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleToggleStatus(row as unknown as EventRow)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title={row.status === 'published' ? 'Unpublish' : 'Publish'}
            >
              {row.status === 'published' ? <ToggleRight size={15} className="text-green-400" /> : <ToggleLeft size={15} />}
            </button>
            <button
              onClick={() => openEdit(row as unknown as EventRow)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDelete(row as unknown as EventRow)}
              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-brand-dark border border-white/15 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-heading font-bold text-white text-lg">
                {modal === 'create' ? 'New Event' : 'Edit Event'}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Title *</label>
                <input type="text" value={form.title} onChange={e => handleTitleChange(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Slug</label>
                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as EventCategory }))} className={`${inputClass} appearance-none [&>option]:bg-brand-dark capitalize`}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EventStatus }))} className={`${inputClass} appearance-none [&>option]:bg-brand-dark`}>
                    {['draft','published','cancelled','completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Date & Time *</label>
                <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Price (€)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Capacity</label>
                  <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Location</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputClass} placeholder="Venue name or address" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Image URL</label>
                <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} resize-none`} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-brand-primary hover:brightness-110 text-white text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (modal === 'create' ? 'Create Event' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
