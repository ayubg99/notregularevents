'use client'

import { useState, useTransition, useRef } from'react'
import { useRouter } from'next/navigation'
import { createClient } from'@/lib/supabase/client'
import {
  createPartnerRoom, updatePartnerRoom,
  togglePartnerRoomStatus, deletePartnerRoom,
} from'@/app/actions/admin'
import type {
  HousingPartnerRow, PartnerRoomRow, PartnerRoomStatus,
  PartnerRoomInsert,
} from'@/types/database'

const NEIGHBORHOODS = [
'Ruzafa','El Carmen','Benimaclet','Blasco Ibáñez','Ciudad de las Artes',
'Gran Vía','Campanar','Algirós','Quatre Carreres','Patraix',
'Jesús','La Saïdia','Extramurs','Poblats Marítims','Other',
]

const ROOM_TYPES = [
  { value:'private_room', label:'Private Room' },
  { value:'shared_room', label:'Shared Room' },
  { value:'studio', label:'Studio' },
  { value:'full_apartment', label:'Full Apartment' },
]

const AMENITIES_OPTIONS = [
  { value:'wifi', label:' WiFi' },
  { value:'ac', label:' AC' },
  { value:'washing_machine', label:' Washing machine' },
  { value:'balcony', label:' Balcony' },
  { value:'bills_included', label:' Bills included' },
  { value:'furnished', label:' Furnished' },
  { value:'private_bathroom', label:' Private bathroom' },
  { value:'near_university', label:' Near university' },
  { value:'parking', label:' Parking' },
  { value:'elevator', label:' Elevator' },
  { value:'heating', label:' Heating' },
]

const NATIONALITIES = [
'Afghan','Albanian','Algerian','American','Argentine','Australian','Austrian','Belgian',
'Brazilian','British','Bulgarian','Canadian','Chilean','Chinese','Colombian','Croatian',
'Czech','Danish','Dutch','Egyptian','Estonian','Finnish','French','German','Greek',
'Hungarian','Indian','Indonesian','Iranian','Irish','Italian','Japanese','Jordanian',
'Korean','Latvian','Lebanese','Lithuanian','Malaysian','Mexican','Moroccan','Norwegian',
'Pakistani','Polish','Portuguese','Romanian','Russian','Saudi','Serbian','Singaporean',
'Slovak','Slovenian','Spanish','Swedish','Swiss','Turkish','Ukrainian','Vietnamese',
]

interface RoomFormState {
  title: string
  neighborhood: string
  room_type: string
  monthly_rent: string
  deposit_amount: string
  platform_fee: string
  available_from: string
  available_until: string
  flatmates_count: string
  flatmates_nationalities: string[]
  gender_preference: string
  bills_included: boolean
  amenities: string[]
  description: string
  photos: string[]
  status: PartnerRoomStatus
  featured: boolean
}

const EMPTY_ROOM: RoomFormState = {
  title:'', neighborhood:'', room_type:'private_room',
  monthly_rent:'', deposit_amount:'', platform_fee:'50',
  available_from:'', available_until:'',
  flatmates_count:'0', flatmates_nationalities: [],
  gender_preference:'any', bills_included: false,
  amenities: [], description:'', photos: [],
  status:'available', featured: true,
}

const inputClass ='w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'
const labelClass ='text-white/50 text-xs mb-1.5 block'

const STATUS_COLORS: Record<PartnerRoomStatus, string> = {
  available:'text-green-400 bg-green-400/10 border-green-400/20',
  reserved:'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  occupied:'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function PartnerDetailClient({
  partner,
  rooms,
}: {
  partner: HousingPartnerRow
  rooms: PartnerRoomRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<'add' |'edit' | null>(null)
  const [editing, setEditing] = useState<PartnerRoomRow | null>(null)
  const [form, setForm] = useState<RoomFormState>(EMPTY_ROOM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleAmenity(val: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(val)
        ? f.amenities.filter(a => a !== val)
        : [...f.amenities, val],
    }))
  }

  function toggleNationality(val: string) {
    setForm(f => ({
      ...f,
      flatmates_nationalities: f.flatmates_nationalities.includes(val)
        ? f.flatmates_nationalities.filter(n => n !== val)
        : [...f.flatmates_nationalities, val],
    }))
  }

  function openAdd() {
    setForm(EMPTY_ROOM)
    setEditing(null)
    setModal('add')
  }

  function openEdit(room: PartnerRoomRow) {
    setEditing(room)
    setForm({
      title: room.title,
      neighborhood: room.neighborhood,
      room_type: room.room_type,
      monthly_rent: String(room.monthly_rent),
      deposit_amount: String(room.deposit_amount),
      platform_fee: String(room.platform_fee),
      available_from: room.available_from ??'',
      available_until: room.available_until ??'',
      flatmates_count: String(room.flatmates_count),
      flatmates_nationalities: room.flatmates_nationalities,
      gender_preference: room.gender_preference,
      bills_included: room.bills_included,
      amenities: room.amenities,
      description: room.description ??'',
      photos: room.photos,
      status: room.status,
      featured: room.featured,
    })
    setModal('edit')
  }

  async function handleUploadPhotos(files: FileList) {
    setUploading(true)
    const supabase = createClient()
    const urls: string[] = []

    for (const file of Array.from(files)) {
      if (form.photos.length + urls.length >= 8) break
      const ext = file.name.split('.').pop()
      const path =`partner-rooms/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('partner-rooms').upload(path, file, { upsert: false })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('partner-rooms').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }

    setForm(f => ({ ...f, photos: [...f.photos, ...urls].slice(0, 8) }))
    setUploading(false)
  }

  function removePhoto(url: string) {
    setForm(f => ({ ...f, photos: f.photos.filter(p => p !== url) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.neighborhood || !form.monthly_rent || !form.deposit_amount) {
      showToast('Please fill in all required fields.')
      return
    }

    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
      +'-' + Math.random().toString(36).slice(2, 6)

    startTransition(async () => {
      const data: PartnerRoomInsert = {
        partner_id: partner.id,
        title: form.title,
        slug: editing ? (editing.slug ?? slug) : slug,
        neighborhood: form.neighborhood,
        room_type: form.room_type as PartnerRoomInsert['room_type'],
        monthly_rent: parseFloat(form.monthly_rent),
        deposit_amount: parseFloat(form.deposit_amount),
        platform_fee: parseFloat(form.platform_fee) || 50,
        available_from: form.available_from || null,
        available_until: form.available_until || null,
        flatmates_count: parseInt(form.flatmates_count) || 0,
        flatmates_nationalities: form.flatmates_nationalities,
        gender_preference: form.gender_preference as PartnerRoomInsert['gender_preference'],
        bills_included: form.bills_included,
        amenities: form.amenities,
        description: form.description || null,
        address: null,
        photos: form.photos,
        status: form.status,
        featured: form.featured,
      }

      const result = editing
        ? await updatePartnerRoom(editing.id, data)
        : await createPartnerRoom(data)

      if (result.success) {
        setModal(null)
        router.refresh()
        showToast(editing ?'Room updated.' :'Room added.')
      } else {
        showToast(result.error ??'Failed to save room.')
      }
    })
  }

  function handleToggleStatus(room: PartnerRoomRow) {
    const next: PartnerRoomStatus = room.status ==='available' ?'occupied' :'available'
    startTransition(async () => {
      const result = await togglePartnerRoomStatus(room.id, next)
      if (result.success) router.refresh()
      else showToast(result.error ??'Failed to update.')
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePartnerRoom(id)
      if (result.success) {
        setConfirmDelete(null)
        router.refresh()
        showToast('Room deleted.')
      } else {
        showToast(result.error ??'Failed to delete.')
      }
    })
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-dark border border-white/20 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Partner info */}
      <div className="glass-card rounded-2xl p-5 mb-6 flex items-center gap-4">
        {partner.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.logo_url} alt={partner.name} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
            {partner.name[0]}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">{partner.name}</h2>
          <p className="text-white/50 text-sm">{partner.contact_name} · {partner.contact_email}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
          partner.status ==='active'
            ?'text-green-400 bg-green-400/10 border-green-400/20'
            :'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
        }`}>
          {partner.status}
        </span>
      </div>

      {/* Rooms header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Rooms ({rooms.length})</h3>
        <button onClick={openAdd} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
          + Add Room
        </button>
      </div>

      {/* Rooms table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-10 text-center text-white/40">No rooms yet. Add the first room above.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 text-xs px-5 py-3">Room</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Rent</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Status</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Views</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Sold</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Featured</th>
                <th className="text-left text-white/40 text-xs px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {room.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={room.photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">{room.title}</p>
                        <p className="text-white/40 text-xs">{room.neighborhood}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white text-sm">€{room.monthly_rent}/mo</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleStatus(room)}
                      disabled={isPending}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors hover:opacity-80 ${STATUS_COLORS[room.status]}`}
                    >
                      {room.status}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-white/50 text-sm">{room.views}</td>
                  <td className="px-5 py-3 text-white/50 text-sm">{room.contacts_sold}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs ${room.featured ?'text-orange-400' :'text-white/30'}`}>
                      {room.featured ?' Yes' :'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(room)} className="text-white/50 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => setConfirmDelete(room.id)} className="text-red-400/70 hover:text-red-400 text-xs px-2.5 py-1 rounded-lg bg-red-400/5 hover:bg-red-400/10 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit room modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl mb-8">
            <h2 className="text-white font-bold text-lg mb-5">{modal ==='edit' ?'Edit Room' :'Add Room'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className={labelClass}>Title *</label>
                <input required className={inputClass} placeholder="e.g. Bright private room in Ruzafa" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Neighborhood *</label>
                  <select required className={inputClass} value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}>
                    <option value="">Select…</option>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Room type *</label>
                  <select required className={inputClass} value={form.room_type} onChange={e => set('room_type', e.target.value)}>
                    {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Monthly rent (€) *</label>
                  <input required type="number" min="1" className={inputClass} placeholder="350" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Deposit (€) *</label>
                  <input required type="number" min="0" className={inputClass} placeholder="700" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Platform fee (€)</label>
                  <input type="number" min="0" className={inputClass} value={form.platform_fee} onChange={e => set('platform_fee', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Available from</label>
                  <input type="date" className={inputClass} value={form.available_from} onChange={e => set('available_from', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Available until</label>
                  <input type="date" className={inputClass} value={form.available_until} onChange={e => set('available_until', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Flatmates count</label>
                  <input type="number" min="0" max="10" className={inputClass} value={form.flatmates_count} onChange={e => set('flatmates_count', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Gender preference</label>
                  <select className={inputClass} value={form.gender_preference} onChange={e => set('gender_preference', e.target.value)}>
                    <option value="any">Any gender</option>
                    <option value="female">Female only</option>
                    <option value="male">Male only</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              {/* Flatmate nationalities */}
              <div>
                <label className={labelClass}>Flatmate nationalities</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-white/3 rounded-xl border border-white/10">
                  {NATIONALITIES.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNationality(n)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        form.flatmates_nationalities.includes(n)
                          ?'border-brand-accent bg-brand-accent/15 text-brand-accent'
                          :'border-white/10 text-white/40 hover:border-white/25'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-brand-primary" checked={form.bills_included} onChange={e => set('bills_included', e.target.checked)} />
                  <span className="text-white/60 text-sm">Bills included</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-amber-400" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                  <span className="text-white/60 text-sm">Featured</span>
                </label>
              </div>

              {/* Amenities */}
              <div>
                <label className={labelClass}>Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AMENITIES_OPTIONS.map(a => (
                    <label key={a.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-brand-primary" checked={form.amenities.includes(a.value)} onChange={() => toggleAmenity(a.value)} />
                      <span className="text-white/60 text-sm">{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Describe the room…" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>

              {/* Status */}
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value as PartnerRoomStatus)}>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                </select>
              </div>

              {/* Photo upload */}
              <div>
                <label className={labelClass}>Photos (up to 8)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handleUploadPhotos(e.target.files)}
                />
                <button
                  type="button"
                  disabled={uploading || form.photos.length >= 8}
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-white/40 hover:text-white/60 transition-colors disabled:opacity-40"
                >
                  {uploading ?'Uploading…' :`+ Add photos (${form.photos.length}/8)`}
                </button>
                {form.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {form.photos.map(url => (
                      <div key={url} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removePhoto(url)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending || uploading} className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {isPending ?'Saving…' :'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white font-semibold mb-2">Delete this room?</p>
            <p className="text-white/50 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm bg-red-500/80 hover:bg-red-500 text-white font-semibold disabled:opacity-50">
                {isPending ?'Deleting…' :'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
