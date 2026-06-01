'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2, ChevronDown, PlusCircle, MinusCircle, Users, Ban } from 'lucide-react'
import Link from 'next/link'
import DataTable from '@/components/admin/DataTable'
import ImageUpload from '@/components/admin/ImageUpload'
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import { createClient } from '@/lib/supabase/client'
import { createTrip, updateTrip, deleteTrip, duplicateTrip } from '@/app/actions/admin'
import type { TripRow, TripInsert, TripStatus, ItineraryDay, TripExtra } from '@/types/database'

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
  destination:         string
  start_date:          string
  end_date:            string
  price_standard:      string
  price_early_bird:    string
  price_group:         string
  early_bird_deadline: string
  early_bird_seats:    string
  group_min_size:      string
  capacity:            string
  image_url:           string
  whatsapp_group_url:  string
  status:              TripStatus
}

const defaultForm = (): FormState => ({
  title: '', slug: '', description: '', destination: '',
  start_date: '', end_date: '',
  price_standard: '', price_early_bird: '', price_group: '',
  early_bird_deadline: '', early_bird_seats: '20', group_min_size: '4',
  capacity: '50', image_url: '', whatsapp_group_url: '', status: 'draft',
})

interface Props { initialTrips: TripRow[] }

export default function TripsManager({ initialTrips }: Props) {
  const router = useRouter()
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<TripRow | null>(null)
  const [form,    setForm]    = useState<FormState>(defaultForm())
  const [toast,          setToast]          = useState('')
  const [toastIsSuccess, setToastIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [groupEnabled, setGroupEnabled] = useState(false)

  const [notifySubscribers, setNotifySubscribers] = useState(false)

  const [cancelTarget,  setCancelTarget]  = useState<TripRow | null>(null)
  const [cancelPreview, setCancelPreview] = useState<{ count: number; total: number } | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Array-field state (parallel to FormState)
  const [meetingPoints,  setMeetingPoints]  = useState<string[]>([])
  const [itinerary,      setItinerary]      = useState<ItineraryDay[]>([])
  const [whatsIncluded,  setWhatsIncluded]  = useState<string[]>([])
  const [whatsExcluded,  setWhatsExcluded]  = useState<string[]>([])
  const [galleryImages,  setGalleryImages]  = useState<string[]>([])
  const [extras,         setExtras]         = useState<TripExtra[]>([])

  function showToast(msg: string, success = false) {
    setToast(msg)
    setToastIsSuccess(success)
    setTimeout(() => setToast(''), 3500)
  }

  function openCreate() {
    setEditing(null)
    setForm(defaultForm())
    setGroupEnabled(false)
    setNotifySubscribers(false)
    setMeetingPoints([])
    setItinerary([])
    setWhatsIncluded([])
    setWhatsExcluded([])
    setGalleryImages([])
    setExtras([])
    setToast('')
    setModal('create')
  }

  function openEdit(trip: TripRow) {
    setEditing(trip)
    setGroupEnabled(trip.price_group != null)
    setMeetingPoints(trip.meeting_points ?? [])
    setItinerary(trip.itinerary ?? [])
    setWhatsIncluded(trip.whats_included ?? [])
    setWhatsExcluded(trip.whats_excluded ?? [])
    setGalleryImages(trip.gallery_images ?? [])
    setExtras(trip.extras ?? [])
    setForm({
      title:               trip.title,
      slug:                trip.slug,
      description:         trip.description ?? '',
      destination:         trip.destination,
      start_date:          trip.start_date?.slice(0, 10) ?? '',
      end_date:            trip.end_date?.slice(0, 10) ?? '',
      price_standard:      String(trip.price_standard),
      price_early_bird:    trip.price_early_bird != null ? String(trip.price_early_bird) : '',
      price_group:         trip.price_group != null ? String(trip.price_group) : '',
      early_bird_deadline: trip.early_bird_deadline ? trip.early_bird_deadline.slice(0, 16) : '',
      early_bird_seats:    String(trip.early_bird_seats ?? 20),
      group_min_size:      String(trip.group_min_size ?? 4),
      capacity:            String(trip.capacity),
      image_url:           trip.image_url ?? '',
      whatsapp_group_url:  trip.whatsapp_group_url ?? '',
      status:              trip.status,
    })
    setToast('')
    setModal('edit')
  }

  function parseOptional(val: string): number | null {
    return val.trim() ? parseFloat(val) : null
  }

  // Duration display
  const nights = form.start_date && form.end_date
    ? Math.max(0, Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 864e5))
    : 0
  const durationLabel = nights > 0 ? `${nights + 1} days / ${nights} nights` : ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const stdPrice = parseFloat(form.price_standard) || 0
    const ebPrice  = parseOptional(form.price_early_bird)
    if (ebPrice !== null && ebPrice >= stdPrice) {
      showToast('Early bird price must be less than the standard price.')
      return
    }
    if (ebPrice !== null && form.early_bird_deadline && form.start_date) {
      if (new Date(form.early_bird_deadline) >= new Date(form.start_date)) {
        showToast('Early bird deadline must be before the trip start date.')
        return
      }
    }

    startTransition(async () => {
      const data: TripInsert = {
        title:               form.title,
        slug:                form.slug || toSlug(form.title),
        description:         form.description || null,
        destination:         form.destination,
        start_date:          form.start_date,
        end_date:            form.end_date,
        price_standard:      stdPrice,
        price_early_bird:    ebPrice,
        price_group:         groupEnabled ? parseOptional(form.price_group) : null,
        early_bird_deadline: form.early_bird_deadline ? new Date(form.early_bird_deadline).toISOString() : null,
        early_bird_seats:    parseInt(form.early_bird_seats) || 20,
        group_min_size:      groupEnabled ? (parseInt(form.group_min_size) || 4) : null,
        capacity:            parseInt(form.capacity) || 50,
        image_url:           form.image_url || null,
        whatsapp_group_url:  form.whatsapp_group_url || null,
        status:              form.status,
        category:            null,
        itinerary:           itinerary.length ? itinerary : null,
        whats_included:      whatsIncluded.filter(s => s.trim()).length ? whatsIncluded.filter(s => s.trim()) : null,
        whats_excluded:      whatsExcluded.filter(s => s.trim()).length ? whatsExcluded.filter(s => s.trim()) : null,
        meeting_points:      meetingPoints.filter(s => s.trim()).length ? meetingPoints.filter(s => s.trim()) : null,
        gallery_images:      galleryImages.length ? galleryImages : null,
        extras:              extras.filter(e => e.name.trim()).length ? extras.filter(e => e.name.trim()) : null,
        created_by:          null,
      }
      const result = modal === 'edit' && editing
        ? await updateTrip(editing.id, data)
        : await createTrip(data, notifySubscribers)

      if (result.success) {
        setModal(null)
        router.refresh()
        if (notifySubscribers && result.notified !== undefined) {
          showToast(`Trip created · ${result.notified} subscriber${result.notified !== 1 ? 's' : ''} notified`, true)
        }
      } else {
        showToast(result.error ?? 'Failed to save trip.')
      }
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

  async function handleDuplicateTrip(trip: TripRow) {
    const result = await duplicateTrip(trip.id)
    if (!result.success || !result.id) {
      showToast('Failed to duplicate trip')
      return
    }
    const supabase = createClient()
    const { data: newTrip } = await supabase
      .from('trips').select('*').eq('id', result.id).single()
    showToast('Duplicated! Set the new dates and title before publishing.', true)
    if (newTrip) openEdit(newTrip as TripRow)
    router.refresh()
  }

  async function handleCancelTrip(trip: TripRow) {
    setCancelTarget(trip)
    setCancelPreview(null)
    try {
      const res  = await fetch(`/api/admin/cancel-trip?tripId=${trip.id}`)
      const data = await res.json() as { count: number; total: number }
      setCancelPreview(data)
    } catch {
      // Preview is optional — modal still shows without counts
    }
  }

  async function confirmCancelTrip() {
    if (!cancelTarget) return
    setCancelLoading(true)
    try {
      const res = await fetch('/api/admin/cancel-trip', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tripId: cancelTarget.id }),
      })
      const data = await res.json() as { refunded: number; failed: number }
      setCancelTarget(null)
      setCancelPreview(null)
      showToast(`Trip cancelled. ${data.refunded} refund${data.refunded !== 1 ? 's' : ''} issued${data.failed ? `, ${data.failed} failed` : ''}.`)
      router.refresh()
    } catch {
      showToast('Failed to cancel trip. Please try again.')
    } finally {
      setCancelLoading(false)
    }
  }

  // Pricing preview
  const stdNum = parseFloat(form.price_standard) || 0
  const ebNum  = parseOptional(form.price_early_bird)
  const grpNum = groupEnabled ? parseOptional(form.price_group) : null

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
  const labelClass = 'text-white/50 text-xs mb-1.5 block'

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
            <Link
              href={`/admin/trips/${row.id as string}/attendees`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              <Users size={12} />
              Attendees
            </Link>
            <button onClick={() => handleToggleStatus(row as unknown as TripRow)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title={row.status === 'published' ? 'Unpublish' : 'Publish'}>
              {row.status === 'published' ? <ToggleRight size={15} className="text-green-400" /> : <ToggleLeft size={15} />}
            </button>
            <button
              onClick={() => handleDuplicateTrip(row as unknown as TripRow)}
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
            <button onClick={() => openEdit(row as unknown as TripRow)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
            <button
              onClick={() => handleCancelTrip(row as unknown as TripRow)}
              disabled={(row.status as string) === 'cancelled'}
              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Cancel Trip & Refund All"
            >
              <Ban size={14} />
            </button>
            <button onClick={() => handleDelete(row as unknown as TripRow)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
          </div>
        )}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-brand-dark border border-white/15 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-heading font-bold text-white text-lg">{modal === 'create' ? 'New Trip' : 'Edit Trip'}</h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
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
                    This is a duplicate. Set the new dates and update the title before publishing.
                  </p>
                </div>
              )}

              {/* Basic Info */}
              <Section title="Basic Info">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: toSlug(e.target.value) }))} required className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Destination *</label>
                    <input type="text" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <div className="relative">
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TripStatus }))} className={`${inputClass} appearance-none pr-8 [&>option]:bg-brand-dark`}>
                        {['draft','published','cancelled','completed'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Dates */}
              <Section title="Dates">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Start Date *</label>
                    <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>End Date *</label>
                    <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required className={inputClass} />
                  </div>
                </div>
                {durationLabel && (
                  <p className="text-xs text-white/40">{durationLabel}</p>
                )}
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
                        {editing.seats_sold} sold · {Math.max(0, editing.capacity - editing.seats_sold)} left
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* Pricing */}
              <Section title="Pricing">
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
                      <input type="number" min="0" step="0.01" value={form.price_standard} onChange={e => setForm(f => ({ ...f, price_standard: e.target.value }))} required className={inputClass} placeholder="0" />
                    </div>
                  </div>

                  {/* Group */}
                  <div className={`rounded-xl border p-3 flex flex-col gap-2 transition-colors ${groupEnabled ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 bg-white/3'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${groupEnabled ? 'text-green-400' : 'text-white/30'}`}>👥 Group</span>
                      <button
                        type="button"
                        onClick={() => setGroupEnabled(v => !v)}
                        className="relative flex-shrink-0"
                        style={{ width: '32px', height: '18px' }}
                      >
                        <div className={`w-8 h-4.5 rounded-full transition-colors ${groupEnabled ? 'bg-green-500' : 'bg-white/15'}`} style={{ height: '18px', borderRadius: '9px' }} />
                        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm ${groupEnabled ? 'left-[14px]' : 'left-0.5'}`} />
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
              </Section>

              {/* Trip Details */}
              <Section title="Trip Details">
                {/* Pickup Locations */}
                <div>
                  <label className={labelClass}>Pickup Locations</label>
                  <div className="flex flex-col gap-2">
                    {meetingPoints.map((pt, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={pt}
                          onChange={e => setMeetingPoints(mp => mp.map((v, j) => j === i ? e.target.value : v))}
                          className={`${inputClass} flex-1`}
                          placeholder={`Location ${i + 1}`}
                        />
                        <button type="button" onClick={() => setMeetingPoints(mp => mp.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-colors">
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setMeetingPoints(mp => [...mp, ''])} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors self-start">
                      <PlusCircle size={14} /> Add location
                    </button>
                  </div>
                </div>

                {/* Itinerary */}
                <div>
                  <label className={labelClass}>Itinerary</label>
                  <div className="flex flex-col gap-3">
                    {itinerary.map((day, i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white/40">Day {i + 1}</span>
                          <button type="button" onClick={() => setItinerary(it => it.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition-colors">
                            <MinusCircle size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={day.title}
                          onChange={e => setItinerary(it => it.map((d, j) => j === i ? { ...d, title: e.target.value } : d))}
                          className={inputClass}
                          placeholder="Day title"
                        />
                        <textarea
                          rows={2}
                          value={day.description}
                          onChange={e => setItinerary(it => it.map((d, j) => j === i ? { ...d, description: e.target.value } : d))}
                          className={`${inputClass} resize-none`}
                          placeholder="What happens this day…"
                        />
                      </div>
                    ))}
                    <button type="button" onClick={() => setItinerary(it => [...it, { day: it.length + 1, title: '', description: '' }])} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors self-start">
                      <PlusCircle size={14} /> Add day
                    </button>
                  </div>
                </div>

                {/* What's Included */}
                <div>
                  <label className={labelClass}>What&apos;s Included</label>
                  <div className="flex flex-col gap-2">
                    {whatsIncluded.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={e => setWhatsIncluded(wi => wi.map((v, j) => j === i ? e.target.value : v))}
                          className={`${inputClass} flex-1`}
                          placeholder="e.g. Hotel accommodation"
                        />
                        <button type="button" onClick={() => setWhatsIncluded(wi => wi.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-colors">
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setWhatsIncluded(wi => [...wi, ''])} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors self-start">
                      <PlusCircle size={14} /> Add item
                    </button>
                  </div>
                </div>

                {/* What's Excluded */}
                <div>
                  <label className={labelClass}>What&apos;s Excluded</label>
                  <div className="flex flex-col gap-2">
                    {whatsExcluded.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={e => setWhatsExcluded(we => we.map((v, j) => j === i ? e.target.value : v))}
                          className={`${inputClass} flex-1`}
                          placeholder="e.g. Flights"
                        />
                        <button type="button" onClick={() => setWhatsExcluded(we => we.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-colors">
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setWhatsExcluded(we => [...we, ''])} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors self-start">
                      <PlusCircle size={14} /> Add item
                    </button>
                  </div>
                </div>

                {/* Optional Add-ons */}
                <div>
                  <label className={labelClass}>Optional Add-ons</label>
                  <p className="text-white/25 text-xs mb-2">Extras users can select during booking (price 0 = free, no Stripe fee).</p>
                  <div className="flex flex-col gap-3">
                    {extras.map((extra, i) => (
                      <div key={extra.id} className="rounded-xl border border-white/10 bg-white/3 p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white/40">Add-on {i + 1}</span>
                          <button type="button" onClick={() => setExtras(ex => ex.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition-colors">
                            <MinusCircle size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={extra.name}
                              onChange={e => setExtras(ex => ex.map((v, j) => j === i ? { ...v, name: e.target.value } : v))}
                              className={inputClass}
                              placeholder="e.g. Museum Entry, Travel Insurance"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={extra.price}
                              onChange={e => setExtras(ex => ex.map((v, j) => j === i ? { ...v, price: parseFloat(e.target.value) || 0 } : v))}
                              className={inputClass}
                              placeholder="€ price"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={extra.description}
                          onChange={e => setExtras(ex => ex.map((v, j) => j === i ? { ...v, description: e.target.value } : v))}
                          className={inputClass}
                          placeholder="Short description, e.g. entry to Sagrada Família"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExtras(ex => [...ex, { id: Math.random().toString(36).slice(2, 8), name: '', price: 0, description: '' }])}
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors self-start"
                    >
                      <PlusCircle size={14} /> Add add-on
                    </button>
                  </div>
                </div>
              </Section>

              {/* WhatsApp */}
              <Section title="WhatsApp Group">
                <div>
                  <label className={labelClass}>WhatsApp Group URL</label>
                  <input type="url" value={form.whatsapp_group_url} onChange={e => setForm(f => ({ ...f, whatsapp_group_url: e.target.value }))} className={inputClass} placeholder="https://chat.whatsapp.com/…" />
                </div>
              </Section>

              {/* Media */}
              <Section title="Media">
                <div>
                  <label className={labelClass}>Cover image</label>
                  <ImageUpload
                    value={form.image_url}
                    onChange={url => setForm(f => ({ ...f, image_url: url }))}
                    folder="trips"
                  />
                </div>
                <div>
                  <label className={labelClass}>Gallery photos (shown as scrollable strip on the trip page)</label>
                  <MultiImageUpload
                    value={galleryImages}
                    onChange={setGalleryImages}
                    folder="trips"
                  />
                </div>
              </Section>

              {/* Description */}
              <Section title="Description">
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} resize-none`} placeholder="Describe the trip…" />
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
                    <p className="text-xs text-white/40 mt-0.5">Send an announcement email to all subscribers when this trip is created</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ml-3 ${
                    notifySubscribers ? 'bg-brand-primary text-white' : 'border border-white/20'
                  }`}>
                    {notifySubscribers ? '✓' : ''}
                  </div>
                </button>
              )}

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

      {/* Cancel Trip Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-dark border border-red-500/30 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-heading font-bold text-white text-lg">Cancel Trip & Refund All?</h2>
            <p className="text-white/60 text-sm">
              Cancel <strong className="text-white">{cancelTarget.title}</strong> and refund all confirmed bookings?
            </p>
            {cancelPreview ? (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex flex-col gap-1">
                <p className="text-white/40 text-xs">Bookings to refund</p>
                <p className="text-white font-semibold">{cancelPreview.count} booking{cancelPreview.count !== 1 ? 's' : ''}</p>
                <p className="text-red-400 font-mono font-bold text-lg">€{cancelPreview.total.toFixed(2)} total</p>
              </div>
            ) : (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-white/30 text-sm">Loading booking details…</p>
              </div>
            )}
            <p className="text-white/30 text-xs">This cannot be undone. All students will receive a refund email.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setCancelTarget(null); setCancelPreview(null) }}
                className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-medium transition-colors"
              >
                Keep Trip
              </button>
              <button
                onClick={confirmCancelTrip}
                disabled={cancelLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:brightness-110 text-white text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {cancelLoading ? <><Loader2 size={14} className="animate-spin" /> Cancelling…</> : 'Cancel Trip + Refund All'}
              </button>
            </div>
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
