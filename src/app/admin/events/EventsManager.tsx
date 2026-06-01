'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2, ChevronDown, Users } from 'lucide-react'
import Link from 'next/link'
import DataTable from '@/components/admin/DataTable'
import ImageUpload from '@/components/admin/ImageUpload'
import { createClient } from '@/lib/supabase/client'
import { createEvent, updateEvent, deleteEvent, duplicateEvent } from '@/app/actions/admin'
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/30">{title}</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>
      {children}
    </div>
  )
}

interface FormState {
  title:               string
  slug:                string
  description:         string
  category:            EventCategory
  date:                string
  location:            string
  image_url:           string
  price:               string
  price_early_bird:    string
  price_group:         string
  early_bird_deadline: string
  early_bird_seats:    string
  group_min_size:      string
  capacity:            string
  status:              EventStatus
}

const defaultForm = (): FormState => ({
  title: '', slug: '', description: '', category: 'party',
  date: '', location: '', image_url: '',
  price: '', price_early_bird: '', price_group: '',
  early_bird_deadline: '', early_bird_seats: '20', group_min_size: '4',
  capacity: '100', status: 'draft',
})

interface Props { initialEvents: EventRow[] }

export default function EventsManager({ initialEvents }: Props) {
  const router = useRouter()
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [form,    setForm]    = useState<FormState>(defaultForm())
  const [toast,          setToast]          = useState('')
  const [toastIsSuccess, setToastIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [groupEnabled, setGroupEnabled] = useState(false)
  const [eventPricing, setEventPricing] = useState<'paid' | 'free_all' | 'free_members'>('paid')
  const [notifySubscribers, setNotifySubscribers] = useState(false)

  function showToast(msg: string, success = false) {
    setToast(msg)
    setToastIsSuccess(success)
    setTimeout(() => setToast(''), 3500)
  }

  function openCreate() {
    setEditing(null)
    setForm(defaultForm())
    setGroupEnabled(false)
    setEventPricing('paid')
    setNotifySubscribers(false)
    setToast('')
    setModal('create')
  }

  function openEdit(event: EventRow) {
    setEditing(event)
    setGroupEnabled(event.price_group != null)
    setEventPricing(event.members_only_free ? 'free_members' : event.is_free ? 'free_all' : 'paid')
    setForm({
      title:               event.title,
      slug:                event.slug,
      description:         event.description ?? '',
      category:            event.category,
      date:                event.date?.slice(0, 16) ?? '',
      location:            event.location ?? '',
      image_url:           event.image_url ?? '',
      price:               String(event.price),
      price_early_bird:    event.price_early_bird != null ? String(event.price_early_bird) : '',
      price_group:         event.price_group != null ? String(event.price_group) : '',
      early_bird_deadline: event.early_bird_deadline ? event.early_bird_deadline.slice(0, 16) : '',
      early_bird_seats:    String(event.early_bird_seats ?? 20),
      group_min_size:      String(event.group_min_size ?? 4),
      capacity:            String(event.capacity),
      status:              event.status,
    })
    setToast('')
    setModal('edit')
  }

  function handleTitleChange(title: string) {
    setForm(f => ({ ...f, title, slug: toSlug(title) }))
  }

  function parseOptional(val: string): number | null {
    return val.trim() ? parseFloat(val) : null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validation
    const stdPrice = parseFloat(form.price) || 0
    const ebPrice  = parseOptional(form.price_early_bird)
    if (eventPricing === 'paid') {
      if (ebPrice !== null && ebPrice >= stdPrice) {
        showToast('Early bird price must be less than the standard price.')
        return
      }
      if (ebPrice !== null && form.early_bird_deadline && form.date) {
        if (new Date(form.early_bird_deadline) >= new Date(form.date)) {
          showToast('Early bird deadline must be before the event date.')
          return
        }
      }
    }

    startTransition(async () => {
      const data: EventInsert = {
        title:               form.title,
        slug:                form.slug,
        description:         form.description || null,
        category:            form.category,
        date:                form.date,
        location:            form.location || null,
        image_url:           form.image_url || null,
        is_free:             eventPricing === 'free_all',
        members_only_free:   eventPricing === 'free_members',
        price:               eventPricing !== 'paid' ? 0 : stdPrice,
        price_early_bird:    eventPricing !== 'paid' ? null : ebPrice,
        price_group:         eventPricing !== 'paid' ? null : (groupEnabled ? parseOptional(form.price_group) : null),
        early_bird_deadline: eventPricing !== 'paid' ? null : (form.early_bird_deadline ? new Date(form.early_bird_deadline).toISOString() : null),
        early_bird_seats:    parseInt(form.early_bird_seats) || 20,
        group_min_size:      eventPricing !== 'paid' ? null : (groupEnabled ? (parseInt(form.group_min_size) || 4) : null),
        capacity:            parseInt(form.capacity) || 100,
        status:              form.status,
        created_by:          null,
      }
      const result = modal === 'edit' && editing
        ? await updateEvent(editing.id, data)
        : await createEvent(data, notifySubscribers)

      if (result.success) {
        setModal(null)
        router.refresh()
        if (notifySubscribers && result.notified !== undefined) {
          showToast(`Event created · ${result.notified} subscriber${result.notified !== 1 ? 's' : ''} notified`, true)
        }
      } else {
        showToast(result.error ?? 'Failed to save event.')
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

  async function handleDuplicateEvent(event: EventRow) {
    const result = await duplicateEvent(event.id)
    if (!result.success || !result.id) {
      showToast('Failed to duplicate event')
      return
    }
    const supabase = createClient()
    const { data: newEvent } = await supabase
      .from('events').select('*').eq('id', result.id).single()
    showToast('Duplicated! Set the new date and title before publishing.', true)
    if (newEvent) openEdit(newEvent as EventRow)
    router.refresh()
  }

  // Pricing preview values
  const stdNum = parseFloat(form.price) || 0
  const ebNum  = parseOptional(form.price_early_bird)
  const grpNum = groupEnabled ? parseOptional(form.price_group) : null

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
  const labelClass = 'text-white/50 text-xs mb-1.5 block'

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
            <Link
              href={`/admin/events/${row.id as string}/attendees`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              <Users size={12} />
              Attendees
            </Link>
            <button
              onClick={() => handleToggleStatus(row as unknown as EventRow)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title={row.status === 'published' ? 'Unpublish' : 'Publish'}
            >
              {row.status === 'published' ? <ToggleRight size={15} className="text-green-400" /> : <ToggleLeft size={15} />}
            </button>
            <button
              onClick={() => handleDuplicateEvent(row as unknown as EventRow)}
              style={{
                padding: '6px 12px',
                background: 'rgba(78,205,196,0.1)',
                border: '1px solid rgba(78,205,196,0.2)',
                borderRadius: '20px',
                color: '#4ECDC4',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Duplicate
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
          <div className="w-full max-w-2xl bg-brand-dark border border-white/15 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-heading font-bold text-white text-lg">
                {modal === 'create' ? 'New Event' : 'Edit Event'}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">

              {editing?.title.includes('(Copy)') && (
                <div style={{
                  background: 'rgba(78,205,196,0.1)',
                  border: '1px solid rgba(78,205,196,0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <p style={{ color: '#4ECDC4', fontSize: '14px', margin: 0 }}>
                    This is a duplicate. Set the new date and update the title before publishing.
                  </p>
                </div>
              )}

              {/* Basic Info */}
              <Section title="Basic Info">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input type="text" value={form.title} onChange={e => handleTitleChange(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Category</label>
                    <div className="relative">
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as EventCategory }))} className={`${inputClass} appearance-none pr-8 [&>option]:bg-brand-dark capitalize`}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <div className="relative">
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EventStatus }))} className={`${inputClass} appearance-none pr-8 [&>option]:bg-brand-dark`}>
                        {['draft','published','cancelled','completed'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Date & Location */}
              <Section title="Date & Location">
                <div>
                  <label className={labelClass}>Date & Time *</label>
                  <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputClass} placeholder="Venue name or address" />
                </div>
              </Section>

              {/* Capacity */}
              <Section title="Capacity">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Max Capacity</label>
                    <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className={inputClass} />
                  </div>
                  {editing && (
                    <div>
                      <label className={labelClass}>Sold / Remaining</label>
                      <div className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/3 text-white/50 text-sm">
                        {editing.tickets_sold} sold · {Math.max(0, editing.capacity - editing.tickets_sold)} left
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* Pricing */}
              <Section title="Pricing">
                {/* Event type selector */}
                <div className="flex flex-col gap-2">
                  {([
                    { id: 'paid',         label: '💳 Paid Event',            desc: 'Students pay to attend' },
                    { id: 'free_all',     label: '🎉 Free for Everyone',     desc: 'Anyone can register for free' },
                    { id: 'free_members', label: '👑 Free for Members Only', desc: 'Only active members can register' },
                  ] as const).map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setEventPricing(option.id)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
                        eventPricing === option.id
                          ? 'border border-brand-primary/40 bg-brand-primary/5'
                          : 'border border-white/8 bg-white/3 hover:border-white/15'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${eventPricing === option.id ? 'text-brand-primary' : 'text-white'}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">{option.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ${
                        eventPricing === option.id
                          ? 'bg-brand-primary text-white'
                          : 'border border-white/20'
                      }`}>
                        {eventPricing === option.id ? '✓' : ''}
                      </div>
                    </button>
                  ))}
                </div>

                {eventPricing === 'paid' && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Early Bird */}
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex flex-col gap-2">
                        <span className="text-xs font-semibold text-amber-400">🔥 Early Bird</span>
                        <div>
                          <label className={labelClass}>Price (€)</label>
                          <input type="number" min="0" step="0.01" value={form.price_early_bird} onChange={e => setForm(f => ({ ...f, price_early_bird: e.target.value }))} className={inputClass} placeholder="optional" />
                        </div>
                        <div>
                          <label className={labelClass}>Deadline</label>
                          <input type="datetime-local" value={form.early_bird_deadline} onChange={e => setForm(f => ({ ...f, early_bird_deadline: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Seats</label>
                          <input type="number" min="0" value={form.early_bird_seats} onChange={e => setForm(f => ({ ...f, early_bird_seats: e.target.value }))} className={inputClass} />
                        </div>
                      </div>

                      {/* Standard */}
                      <div className="rounded-xl border border-brand-primary/40 bg-brand-primary/5 p-3 flex flex-col gap-2">
                        <span className="text-xs font-semibold text-brand-primary">💰 Standard</span>
                        <div>
                          <label className={labelClass}>Price (€) *</label>
                          <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputClass} placeholder="0" />
                        </div>
                      </div>

                      {/* Group */}
                      <div className={`rounded-xl border p-3 flex flex-col gap-2 transition-colors ${groupEnabled ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/3'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${groupEnabled ? 'text-green-400' : 'text-white/30'}`}>👥 Group</span>
                          <button
                            type="button"
                            onClick={() => setGroupEnabled(v => !v)}
                            className={`w-8 h-4.5 rounded-full transition-colors relative ${groupEnabled ? 'bg-green-500' : 'bg-white/15'}`}
                            style={{ height: '18px', width: '32px' }}
                          >
                            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${groupEnabled ? 'left-[14px]' : 'left-0.5'}`} />
                          </button>
                        </div>
                        <div>
                          <label className={labelClass}>Price/person (€)</label>
                          <input type="number" min="0" step="0.01" value={form.price_group} onChange={e => setForm(f => ({ ...f, price_group: e.target.value }))} disabled={!groupEnabled} className={`${inputClass} disabled:opacity-30`} placeholder="optional" />
                        </div>
                        <div>
                          <label className={labelClass}>Min group size</label>
                          <input type="number" min="2" max="20" value={form.group_min_size} onChange={e => setForm(f => ({ ...f, group_min_size: e.target.value }))} disabled={!groupEnabled} className={`${inputClass} disabled:opacity-30`} />
                        </div>
                      </div>
                    </div>

                    {/* Live pricing preview */}
                    {(stdNum > 0 || ebNum || grpNum) && (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/60 flex flex-col gap-1">
                        <span className="text-white/30 font-semibold uppercase tracking-wider text-[10px]">Preview</span>
                        <div className="flex gap-4 flex-wrap">
                          {ebNum !== null && <span>🔥 Early Bird: <strong className="text-amber-400">€{ebNum.toFixed(2)}</strong> <span className="text-white/30">/ €{(ebNum * 0.90).toFixed(2)} members</span></span>}
                          {stdNum > 0 && <span>💰 Standard: <strong className="text-white/80">€{stdNum.toFixed(2)}</strong> <span className="text-white/30">/ €{(stdNum * 0.90).toFixed(2)} members</span></span>}
                          {grpNum !== null && <span>👥 Group: <strong className="text-green-400">€{grpNum!.toFixed(2)}/pp</strong> <span className="text-white/30">min {form.group_min_size}</span></span>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Section>

              {/* Media */}
              <Section title="Media">
                <ImageUpload
                  value={form.image_url}
                  onChange={url => setForm(f => ({ ...f, image_url: url }))}
                  folder="events"
                />
              </Section>

              {/* Description */}
              <Section title="Description">
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} resize-none`} placeholder="Describe the event…" />
              </Section>

              {/* Notify subscribers — create only */}
              {modal === 'create' && (
                <button
                  type="button"
                  onClick={() => setNotifySubscribers(v => !v)}
                  className={`flex items-center justify-between w-full rounded-xl px-4 py-3 text-left transition-colors ${
                    notifySubscribers
                      ? 'border border-brand-primary/40 bg-brand-primary/5'
                      : 'border border-white/8 bg-white/3 hover:border-white/15'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${notifySubscribers ? 'text-brand-primary' : 'text-white/70'}`}>
                      📣 Notify newsletter subscribers
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">Send an announcement email to all subscribers when this event is created</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ml-3 ${
                    notifySubscribers ? 'bg-brand-primary text-white' : 'border border-white/20'
                  }`}>
                    {notifySubscribers ? '✓' : ''}
                  </div>
                </button>
              )}

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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl ${toastIsSuccess ? 'bg-teal-500/90' : 'bg-red-500/90'}`}>
          {toast}
        </div>
      )}
    </>
  )
}
