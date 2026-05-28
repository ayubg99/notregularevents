'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { HousingListingRow, HousingRoomType, HousingGenderPref } from '@/types/database'

const NEIGHBORHOODS = [
  'Ruzafa', 'El Carmen', 'Benimaclet', 'Malvarrosa',
  'Campanar', 'Mestalla', 'Patraix', 'Algirós', 'Quatre Carreres',
]

const NATIONALITIES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Polish', 'Romanian', 'Greek', 'American', 'British', 'Turkish',
  'Moroccan', 'Brazilian', 'Mexican', 'Chinese', 'Japanese', 'Korean',
  'Indian', 'Australian', 'Other',
]

const AMENITIES = [
  { id: 'wifi',      label: '📶 WiFi'             },
  { id: 'ac',        label: '❄️ AC'               },
  { id: 'washing',   label: '🧺 Washing machine'  },
  { id: 'balcony',   label: '🌿 Balcony'          },
  { id: 'bills',     label: '💡 Bills included'   },
  { id: 'furnished', label: '🪑 Furnished'        },
  { id: 'private_bath', label: '🚿 Private bathroom' },
  { id: 'near_uni',  label: '🏫 Near university'  },
  { id: 'parking',   label: '🅿️ Parking'         },
]

interface FormData {
  title:                  string
  neighborhood:           string
  roomType:               string
  price:                  string
  availableFrom:          string
  availableUntil:         string
  flatmatesCount:         number
  flatmatesNationalities: string[]
  genderPreference:       string
  amenities:              string[]
  description:            string
  photos:                 string[]
  neighborhoodPrefs:      string[]
  moveInDate:             string
  duration:               string
  aboutMe:                string
  contactName:            string
  nationality:            string
  university:             string
  contactWhatsapp:        string
  contactEmail:           string
  status:                 string
}

interface Props {
  listing: HousingListingRow
  userId:  string
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {[1, 2].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            n === step
              ? 'bg-brand-primary text-white'
              : n < step
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white/40'
          }`}>
            {n < step ? '✓' : n}
          </div>
          {n < 2 && <div className={`w-8 h-0.5 ${n < step ? 'bg-green-500' : 'bg-white/10'}`} />}
        </div>
      ))}
      <span className="ml-2 text-white/40 text-sm">Step {step} of 2</span>
    </div>
  )
}

export default function EditListingForm({ listing, userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    title:                  listing.title,
    neighborhood:           listing.neighborhood ?? '',
    roomType:               listing.room_type ?? '',
    price:                  listing.price != null ? String(listing.price) : '',
    availableFrom:          listing.available_from ?? '',
    availableUntil:         listing.available_until ?? '',
    flatmatesCount:         listing.flatmates_count,
    flatmatesNationalities: listing.flatmates_nationalities,
    genderPreference:       listing.gender_preference,
    amenities:              listing.amenities,
    description:            listing.description ?? '',
    photos:                 listing.photos,
    neighborhoodPrefs:      listing.neighborhood ? [listing.neighborhood] : [],
    moveInDate:             listing.available_from ?? '',
    duration:               '',
    aboutMe:                listing.description ?? '',
    contactName:            listing.contact_name,
    nationality:            listing.nationality ?? '',
    university:             listing.university ?? '',
    contactWhatsapp:        listing.contact_whatsapp ?? '',
    contactEmail:           listing.contact_email ?? '',
    status:                 listing.status,
  })

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleArrayItem(key: 'amenities' | 'flatmatesNationalities' | 'neighborhoodPrefs', val: string) {
    setForm(f => {
      const arr = f[key] as string[]
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const supabase = createClient()
    const urls: string[] = [...form.photos]

    for (let i = 0; i < Math.min(files.length, 4 - form.photos.length); i++) {
      const file = files[i]
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
      const { error: upErr } = await supabase.storage.from('housing-photos').upload(path, file)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('housing-photos').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    update('photos', urls)
    setUploading(false)
  }

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    const supabase = createClient()

    const isRoomAvailable = listing.type === 'room_available'

    const payload = {
      title:                   form.title,
      description:             isRoomAvailable ? form.description || null : form.aboutMe || null,
      price:                   isRoomAvailable && form.price ? Number(form.price) : null,
      neighborhood:            isRoomAvailable ? form.neighborhood || null : form.neighborhoodPrefs[0] ?? null,
      room_type:               isRoomAvailable ? (form.roomType as HousingRoomType) || null : null,
      available_from:          isRoomAvailable ? form.availableFrom || null : form.moveInDate || null,
      available_until:         isRoomAvailable ? form.availableUntil || null : null,
      flatmates_count:         form.flatmatesCount,
      flatmates_nationalities: form.flatmatesNationalities,
      amenities:               form.amenities,
      contact_name:            form.contactName,
      contact_whatsapp:        form.contactWhatsapp || null,
      contact_email:           form.contactEmail || null,
      nationality:             form.nationality || null,
      university:              form.university || null,
      gender_preference:       (form.genderPreference as HousingGenderPref) || 'any',
      photos:                  form.photos,
      status:                  form.status as 'active' | 'inactive' | 'rented',
    }

    const { error: updateErr } = await supabase
      .from('housing_listings')
      .update(payload)
      .eq('id', listing.id)
      .eq('user_id', userId)

    setSubmitting(false)

    if (updateErr) {
      setError(updateErr.message)
      return
    }

    router.push('/dashboard')
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50'
  const labelCls = 'block text-xs text-white/50 mb-1.5 font-medium'
  const isRoomAvailable = listing.type === 'room_available'

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-xl mx-auto">

        <div className="text-center mb-2">
          <Link href="/dashboard" className="text-white/40 text-sm hover:text-white/70 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2 mt-4">Edit Listing</h1>
        <p className="text-white/40 text-center text-sm mb-4">
          {isRoomAvailable ? '🏠 Room Available' : '👤 Looking for Room'}
        </p>

        {/* Status selector */}
        <div className="flex gap-2 justify-center mb-8">
          {(['active', 'rented', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => update('status', s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize border ${
                form.status === s
                  ? s === 'active'    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                  : s === 'rented'    ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                  :                    'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <StepIndicator step={step} />

        {/* ─── STEP 1 — listing details ──────────────────────── */}
        {step === 1 && isRoomAvailable && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} placeholder="e.g. Sunny room in Ruzafa" value={form.title} onChange={e => update('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Neighborhood *</label>
                <select className={inputCls} value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)}>
                  <option value="">Select area</option>
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Room type *</label>
                <select className={inputCls} value={form.roomType} onChange={e => update('roomType', e.target.value)}>
                  <option value="">Select type</option>
                  <option value="private_room">Private Room</option>
                  <option value="shared_room">Shared Room</option>
                  <option value="studio">Studio</option>
                  <option value="full_apartment">Full Apartment</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monthly price (€) *</label>
                <input className={inputCls} type="number" placeholder="e.g. 450" value={form.price} onChange={e => update('price', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Gender preference</label>
                <select className={inputCls} value={form.genderPreference} onChange={e => update('genderPreference', e.target.value)}>
                  <option value="any">Any</option>
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Available from *</label>
                <input className={inputCls} type="date" value={form.availableFrom} onChange={e => update('availableFrom', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Available until</label>
                <input className={inputCls} type="date" value={form.availableUntil} onChange={e => update('availableUntil', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Number of flatmates (excluding you)</label>
              <div className="flex items-center gap-3">
                <button onClick={() => update('flatmatesCount', Math.max(0, form.flatmatesCount - 1))} className="w-9 h-9 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">−</button>
                <span className="text-white font-semibold w-6 text-center">{form.flatmatesCount}</span>
                <button onClick={() => update('flatmatesCount', Math.min(5, form.flatmatesCount + 1))} className="w-9 h-9 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">+</button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Flatmate nationalities</label>
              <div className="flex flex-wrap gap-2">
                {NATIONALITIES.slice(0, 12).map(n => (
                  <button
                    key={n}
                    onClick={() => toggleArrayItem('flatmatesNationalities', n)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      form.flatmatesNationalities.includes(n)
                        ? 'bg-brand-primary text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Amenities</label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map(a => (
                  <label key={a.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors ${form.amenities.includes(a.id) ? 'bg-brand-primary/10 border border-brand-primary/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                    <input type="checkbox" checked={form.amenities.includes(a.id)} onChange={() => toggleArrayItem('amenities', a.id)} className="sr-only" />
                    <span className="text-sm">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Description ({form.description.length}/500)</label>
              <textarea className={`${inputCls} resize-none h-24`} placeholder="Describe the room, location, vibe..." maxLength={500} value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Photos (up to 4)</label>
              <div className="flex flex-wrap gap-3">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => update('photos', form.photos.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
                {form.photos.length < 4 && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-white/40 hover:text-white/50 transition-colors disabled:opacity-40"
                  >
                    {uploading ? '…' : '+'}
                  </button>
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e.target.files)} />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.title || !form.neighborhood || !form.roomType || !form.price || !form.availableFrom}
              className="btn-primary w-full py-3 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 1 && !isRoomAvailable && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} placeholder="e.g. Student looking in Ruzafa" value={form.title} onChange={e => update('title', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Preferred neighborhoods</label>
              <div className="flex flex-wrap gap-2">
                {NEIGHBORHOODS.map(n => (
                  <button
                    key={n}
                    onClick={() => toggleArrayItem('neighborhoodPrefs', n)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      form.neighborhoodPrefs.includes(n)
                        ? 'bg-brand-primary text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Move-in date *</label>
                <input className={inputCls} type="date" value={form.moveInDate} onChange={e => update('moveInDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Duration</label>
                <select className={inputCls} value={form.duration} onChange={e => update('duration', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                  <option value="semester">Semester</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Room type preference</label>
                <select className={inputCls} value={form.roomType} onChange={e => update('roomType', e.target.value)}>
                  <option value="">No preference</option>
                  <option value="private_room">Private Room</option>
                  <option value="shared_room">Shared Room</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Flatmate gender pref.</label>
                <select className={inputCls} value={form.genderPreference} onChange={e => update('genderPreference', e.target.value)}>
                  <option value="any">Any</option>
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>About me ({form.aboutMe.length}/500)</label>
              <textarea
                className={`${inputCls} resize-none h-28`}
                placeholder={`Hi! I'm [name] from [country], studying at [university]...`}
                maxLength={500}
                value={form.aboutMe}
                onChange={e => update('aboutMe', e.target.value)}
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.title || !form.moveInDate}
              className="btn-primary w-full py-3 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ─── STEP 2 — contact details ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-white/50 text-sm text-center mb-4">Your contact details (shown to members only)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full name *</label>
                <input className={inputCls} placeholder="Maria García" value={form.contactName} onChange={e => update('contactName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Nationality *</label>
                <select className={inputCls} value={form.nationality} onChange={e => update('nationality', e.target.value)}>
                  <option value="">Select...</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>University</label>
              <input className={inputCls} placeholder="Universitat de València" value={form.university} onChange={e => update('university', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp number *</label>
              <input className={inputCls} type="tel" placeholder="+34 600 000 000" value={form.contactWhatsapp} onChange={e => update('contactWhatsapp', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email (optional)</label>
              <input className={inputCls} type="email" placeholder="student@email.com" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/10 text-white py-3 rounded-full font-semibold text-sm hover:bg-white/15 transition-colors">← Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.contactName || !form.contactWhatsapp}
                className="flex-1 btn-primary py-3 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-white/40 text-sm hover:text-white/60 transition-colors py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
