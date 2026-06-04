'use client'

import { useState, useRef } from 'react'
import * as LucideIcons from 'lucide-react'

function CatIcon({ name, size = 24, color }: { name: string; size?: number; color?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> | undefined
  if (!Icon) return null
  return <Icon size={size} color={color} strokeWidth={1.5} />
}
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORIES, CLOTHES_SIZES, SHOES_SIZES, CONDITIONS,
  NEIGHBORHOODS, NATIONALITIES,
} from '@/lib/marketplace'
import ListingCard from '@/components/marketplace/ListingCard'
import type { MarketplaceListingRow } from '@/types/database'

const PREVIEW_EXPIRES_AT = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
const PREVIEW_NOW = new Date().toISOString()

interface Props {
  userId: string
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '12px 16px',
  background:   'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color:        '#fff',
  fontSize:     '14px',
  outline:      'none',
  boxSizing:    'border-box',
}

const labelStyle: React.CSSProperties = {
  color:        '#ccc',
  fontSize:     '13px',
  fontWeight:   600,
  marginBottom: '8px',
  display:      'block',
}

type FormData = {
  category:           string
  title:              string
  condition:          string
  price:              string
  is_free:            boolean
  is_negotiable:      boolean
  brand:              string
  color:              string
  description:        string
  size_clothes:       string
  size_shoes:         string
  event_title:        string
  event_date:         string
  event_venue:        string
  ticket_quantity:    string
  photos:             string[]
  photoPaths:         string[]
  neighborhood:       string
  seller_name:        string
  seller_nationality: string
  university:         string
  contact_whatsapp:   string
  contact_email:      string
  terms:              boolean
}

const initial: FormData = {
  category: '', title: '', condition: '', price: '', is_free: false, is_negotiable: false,
  brand: '', color: '', description: '', size_clothes: '', size_shoes: '',
  event_title: '', event_date: '', event_venue: '', ticket_quantity: '1',
  photos: [], photoPaths: [], neighborhood: '', seller_name: '',
  seller_nationality: '', university: '', contact_whatsapp: '', contact_email: '', terms: false,
}

export default function PostListingForm({ userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initial)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof FormData, v: FormData[typeof k]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const selectedCat = CATEGORIES.find(c => c.id === form.category)

  // ── Step navigation helpers ────────────────────────────────────
  function validateStep(s: number): string {
    if (s === 1 && !form.category) return 'Please select a category.'
    if (s === 2) {
      if (!form.title.trim())    return 'Title is required.'
      if (!form.condition)       return 'Condition is required.'
      if (!form.is_free && (isNaN(Number(form.price)) || Number(form.price) < 0)) return 'Please enter a valid price.'
      if (selectedCat && 'hasClothesSize' in selectedCat && selectedCat.hasClothesSize && !form.size_clothes) return 'Please select a size.'
      if (selectedCat && 'hasShoesSize'   in selectedCat && selectedCat.hasShoesSize   && !form.size_shoes)   return 'Please select a size.'
      if (selectedCat && 'isTicket' in selectedCat && selectedCat.isTicket) {
        if (!form.event_title.trim()) return 'Event name is required.'
        if (!form.event_date)         return 'Event date is required.'
        if (!form.event_venue.trim()) return 'Venue is required.'
      }
    }
    if (s === 4) {
      if (!form.seller_name.trim())     return 'Your name is required.'
      if (!form.contact_whatsapp.trim()) return 'WhatsApp number is required.'
      if (!form.terms)                  return 'Please agree to the terms.'
    }
    return ''
  }

  function next() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  function back() { setError(''); setStep(s => s - 1) }

  // ── Photo upload ───────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (form.photos.length + files.length > 5) { setError('Maximum 5 photos allowed.'); return }
    setUploading(true)
    setError('')
    const supabase = createClient()
    const newUrls: string[] = []
    const newPaths: string[] = []
    for (const file of files) {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('marketplace-photos').upload(path, file)
      if (upErr) { setError(`Upload failed: ${upErr.message}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('marketplace-photos').getPublicUrl(path)
      newUrls.push(publicUrl)
      newPaths.push(path)
    }
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...newUrls], photoPaths: [...prev.photoPaths, ...newPaths] }))
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDeletePhoto(idx: number) {
    const supabase = createClient()
    const path = form.photoPaths[idx]
    if (path) await supabase.storage.from('marketplace-photos').remove([path])
    setForm(prev => ({
      ...prev,
      photos:     prev.photos.filter((_, i) => i !== idx),
      photoPaths: prev.photoPaths.filter((_, i) => i !== idx),
    }))
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error: insertErr } = await supabase
      .from('marketplace_listings')
      .insert({
        user_id:            userId,
        title:              form.title.trim(),
        description:        form.description.trim() || null,
        price:              form.is_free ? 0 : Number(form.price),
        category:           form.category as MarketplaceListingRow['category'],
        size_clothes:       form.size_clothes || null,
        size_shoes:         form.size_shoes   || null,
        condition:          form.condition as MarketplaceListingRow['condition'],
        event_date:         form.event_date   || null,
        event_venue:        form.event_venue.trim()  || null,
        ticket_quantity:    form.ticket_quantity ? Number(form.ticket_quantity) : null,
        brand:              form.brand.trim()   || null,
        color:              form.color.trim()   || null,
        photos:             form.photos,
        location:           'Valencia',
        neighborhood:       form.neighborhood  || null,
        contact_whatsapp:   form.contact_whatsapp.trim() || null,
        contact_email:      form.contact_email.trim()    || null,
        seller_name:        form.seller_name.trim(),
        seller_nationality: form.seller_nationality || null,
        university:         form.university.trim()  || null,
        is_free:            form.is_free,
        is_negotiable:      form.is_negotiable,
        status:             'active',
        expires_at:         expiresAt,
      })
      .select('id')
      .single()

    if (insertErr || !data) {
      setError(insertErr?.message ?? 'Failed to post listing.')
      setSubmitting(false)
      return
    }

    router.push(`/marketplace/${data.id}`)
  }

  // ── Preview listing object ─────────────────────────────────────
  const preview: MarketplaceListingRow = {
    id:                 'preview',
    user_id:            userId,
    title:              form.title || 'Your item title',
    description:        form.description || null,
    price:              Number(form.price) || 0,
    category:           (form.category || 'other') as MarketplaceListingRow['category'],
    size_clothes:       form.size_clothes || null,
    size_shoes:         form.size_shoes   || null,
    condition:          (form.condition || 'good') as MarketplaceListingRow['condition'],
    event_date:         form.event_date   || null,
    event_venue:        form.event_venue  || null,
    ticket_quantity:    Number(form.ticket_quantity) || null,
    brand:              form.brand        || null,
    color:              form.color        || null,
    photos:             form.photos,
    location:           'Valencia',
    neighborhood:       form.neighborhood || null,
    contact_whatsapp:   form.contact_whatsapp || null,
    contact_email:      form.contact_email    || null,
    seller_name:        form.seller_name      || 'You',
    seller_nationality: form.seller_nationality || null,
    university:         form.university        || null,
    is_free:            form.is_free,
    is_negotiable:      form.is_negotiable,
    status:             'active',
    views:              0,
    expires_at:         PREVIEW_EXPIRES_AT,
    created_at:         PREVIEW_NOW,
    updated_at:         PREVIEW_NOW,
  }

  // ── Shared pill button style ───────────────────────────────────
  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding:      '8px 14px',
    border:       active ? 'none' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '50px',
    background:   active ? '#FF6B00' : 'rgba(255,255,255,0.04)',
    color:        active ? '#1A1A0E' : '#888',
    cursor:       'pointer',
    fontSize:     '13px',
    fontWeight:   active ? 700 : 400,
    transition:   'all 0.15s',
  })

  const stepLabel = ['Category', 'Details', 'Photos', 'Contact', 'Preview']

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* Step progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', alignItems: 'center' }}>
        {stepLabel.map((label, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: n < 5 ? 1 : undefined }}>
              <div style={{
                width:           '28px',
                height:          '28px',
                borderRadius:    '50%',
                background:      done ? '#2ECC71' : active ? '#4ECDC4' : 'rgba(255,255,255,0.08)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontSize:        '12px',
                fontWeight:      700,
                color:           done || active ? '#1A1A0E' : '#555',
                flexShrink:      0,
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ color: active ? '#fff' : '#555', fontSize: '12px', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
              {n < 5 && <div style={{ flex: 1, height: '1px', background: done ? '#2ECC71' : 'rgba(255,255,255,0.08)' }} />}
            </div>
          )
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>

        {/* ── STEP 1: Category ───────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>What are you selling?</h2>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>Select a category for your item.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => set('category', cat.id)}
                  style={{
                    background:    form.category === cat.id ? '#FF6B00' : 'rgba(255,255,255,0.03)',
                    border:        form.category === cat.id ? 'none'    : '1px solid rgba(255,255,255,0.08)',
                    borderRadius:  '12px',
                    padding:       '16px 8px',
                    cursor:        'pointer',
                    textAlign:     'center',
                    transition:    'all 0.2s',
                    display:       'flex',
                    flexDirection: 'column',
                    alignItems:    'center',
                    gap:           '8px',
                  }}
                >
                  <CatIcon name={cat.icon} size={22} color={form.category === cat.id ? '#1A1A0E' : '#666'} />
                  <span style={{ color: form.category === cat.id ? '#1A1A0E' : '#888', fontSize: '11px', fontWeight: 600, lineHeight: 1.3 }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
            {selectedCat && 'isTicket' in selectedCat && selectedCat.isTicket && (
              <div style={{ marginTop: '16px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                <p style={{ color: '#FF6B00', fontSize: '13px', margin: 0 }}>
                  🎟️ Selling event tickets? Add event details so buyers know what they&apos;re getting.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Item details ───────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Item details</h2>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>{selectedCat?.label}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Nike Air Max size 42, barely used"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  maxLength={100}
                  style={inputStyle}
                />
              </div>

              {/* Condition */}
              <div>
                <label style={labelStyle}>Condition *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {CONDITIONS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => set('condition', c.id)}
                      style={{
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '12px',
                        padding:      '12px 16px',
                        background:   form.condition === c.id ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                        border:       form.condition === c.id ? `2px solid ${c.color}` : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        cursor:       'pointer',
                        textAlign:    'left',
                      }}
                    >
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>{c.label}</p>
                        <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0' }}>{c.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label style={labelStyle}>Price *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '16px' }}>€</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                      disabled={form.is_free}
                      style={{ ...inputStyle, paddingLeft: '32px', opacity: form.is_free ? 0.4 : 1 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_free} onChange={e => set('is_free', e.target.checked)} />
                    <span style={{ color: '#ccc', fontSize: '13px' }}>This item is FREE</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_negotiable} onChange={e => set('is_negotiable', e.target.checked)} />
                    <span style={{ color: '#ccc', fontSize: '13px' }}>Price negotiable</span>
                  </label>
                </div>
              </div>

              {/* Clothes size */}
              {selectedCat && 'hasClothesSize' in selectedCat && selectedCat.hasClothesSize && (
                <div>
                  <label style={labelStyle}>Size *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {CLOTHES_SIZES.map(sz => (
                      <button key={sz} onClick={() => set('size_clothes', sz)} style={pillBtn(form.size_clothes === sz)}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shoes size */}
              {selectedCat && 'hasShoesSize' in selectedCat && selectedCat.hasShoesSize && (
                <div>
                  <label style={labelStyle}>Size *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SHOES_SIZES.map(sz => (
                      <button key={sz} onClick={() => set('size_shoes', sz)} style={pillBtn(form.size_shoes === sz)}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket fields */}
              {selectedCat && 'isTicket' in selectedCat && selectedCat.isTicket && (
                <>
                  <div>
                    <label style={labelStyle}>Event name *</label>
                    <input type="text" placeholder="e.g. Pacha Valencia Opening" value={form.event_title} onChange={e => set('event_title', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Event date *</label>
                      <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Number of tickets *</label>
                      <input type="number" min="1" value={form.ticket_quantity} onChange={e => set('ticket_quantity', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Venue *</label>
                    <input type="text" placeholder="e.g. Pacha Valencia, Calle X" value={form.event_venue} onChange={e => set('event_venue', e.target.value)} style={inputStyle} />
                  </div>
                </>
              )}

              {/* Brand + Color */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Brand (optional)</label>
                  <input type="text" placeholder="e.g. Nike, Zara" value={form.brand} onChange={e => set('brand', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Color (optional)</label>
                  <input type="text" placeholder="e.g. Blue, Black" value={form.color} onChange={e => set('color', e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Describe your item — condition details, why you're selling, any defects..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  maxLength={600}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <p style={{ color: '#555', fontSize: '11px', margin: '4px 0 0', textAlign: 'right' }}>
                  {form.description.length}/600
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ── STEP 3: Photos ─────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Add photos</h2>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>Up to 5 photos. Good photos get more interest.</p>

            {form.photos.length < 5 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  width:         '100%',
                  padding:       '32px',
                  border:        '2px dashed rgba(255,255,255,0.15)',
                  borderRadius:  '12px',
                  background:    'rgba(255,255,255,0.02)',
                  color:         uploading ? '#555' : '#888',
                  cursor:        uploading ? 'default' : 'pointer',
                  fontSize:      '14px',
                  marginBottom:  '16px',
                  textAlign:     'center',
                }}
              >
                {uploading ? 'Uploading...' : '📷 Click to upload photos'}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />

            {form.photos.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {form.photos.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    <button
                      onClick={() => handleDeletePhoto(i)}
                      style={{
                        position:   'absolute',
                        top:        '-8px',
                        right:      '-8px',
                        width:      '22px',
                        height:     '22px',
                        borderRadius:'50%',
                        background: '#FF4444',
                        color:      '#fff',
                        border:     'none',
                        cursor:     'pointer',
                        fontSize:   '12px',
                        fontWeight: 700,
                        display:    'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                    {i === 0 && (
                      <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                        MAIN
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.photos.length === 0 && (
              <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                Listings without photos get less attention. Add at least one!
              </p>
            )}
          </div>
        )}

        {/* ── STEP 4: Location & Contact ─────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Location & Contact</h2>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>Only members will see your contact details.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={labelStyle}>Neighborhood</label>
                <select value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} style={{ ...inputStyle, color: form.neighborhood ? '#fff' : '#888' }}>
                  <option value="">Select area in Valencia</option>
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Your first name *</label>
                  <input type="text" placeholder="Sofia" value={form.seller_name} onChange={e => set('seller_name', e.target.value)} style={inputStyle} />
                  <p style={{ color: '#555', fontSize: '11px', margin: '4px 0 0' }}>Shown publicly</p>
                </div>
                <div>
                  <label style={labelStyle}>Nationality</label>
                  <select value={form.seller_nationality} onChange={e => set('seller_nationality', e.target.value)} style={{ ...inputStyle, color: form.seller_nationality ? '#fff' : '#888' }}>
                    <option value="">Select nationality</option>
                    {NATIONALITIES.map(n => <option key={n.code} value={n.label}>{n.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>University (optional)</label>
                <input type="text" placeholder="e.g. UV, UPV, CEU..." value={form.university} onChange={e => set('university', e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>WhatsApp number *</label>
                <input type="tel" placeholder="+34 6XX XXX XXX" value={form.contact_whatsapp} onChange={e => set('contact_whatsapp', e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input type="email" placeholder="you@example.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} style={inputStyle} />
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={e => set('terms', e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0 }}
                />
                <span style={{ color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
                  I confirm this item is genuine and I will respond within 24 hours.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 5: Preview & Submit ───────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Preview your listing</h2>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>This is how it will appear in the marketplace.</p>
            <div style={{ maxWidth: '280px', margin: '0 auto 24px' }}>
              <ListingCard listing={preview} />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width:        '100%',
                padding:      '16px',
                background:   submitting ? '#555' : 'linear-gradient(135deg, #4ECDC4, #2ECC71)',
                color:        '#1A1A0E',
                border:       'none',
                borderRadius: '50px',
                fontWeight:   700,
                fontSize:     '16px',
                cursor:       submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Publishing...' : 'Publish for Free →'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: '16px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
            <p style={{ color: '#FF4444', fontSize: '13px', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px' }}>
          {step > 1 ? (
            <button onClick={back} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', color: '#ccc', cursor: 'pointer', fontSize: '14px' }}>
              ← Back
            </button>
          ) : <div />}

          {step < 5 && (
            <button onClick={next} style={{ padding: '12px 24px', background: '#FF6B00', border: 'none', borderRadius: '50px', color: '#1A1A0E', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
              Continue →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
