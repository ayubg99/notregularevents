'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSponsor, updateSponsor, deleteSponsor } from '@/app/actions/admin'
import ImageUpload from '@/components/admin/ImageUpload'
import type { SponsorRow, SponsorCategory, SponsorStatus } from '@/types/database'

interface FormState {
  name:                    string
  logo_url:                string
  website_url:             string
  description:             string
  discount_text:           string
  discount_code:           string
  redemption_instructions: string
  members_only:            boolean
  category:                SponsorCategory
  is_featured:             boolean
  display_order:           string
  status:                  SponsorStatus
}

const EMPTY_FORM: FormState = {
  name: '', logo_url: '', website_url: '', description: '',
  discount_text: '', discount_code: '', redemption_instructions: '',
  members_only: true, category: 'general', is_featured: false,
  display_order: '0', status: 'active',
}

const CATEGORIES: { value: SponsorCategory; label: string }[] = [
  { value: 'general',    label: 'General'     },
  { value: 'food_drink', label: 'Food & Drink' },
  { value: 'fitness',    label: 'Fitness'     },
  { value: 'nightlife',  label: 'Nightlife'   },
  { value: 'travel',     label: 'Travel'      },
  { value: 'fashion',    label: 'Fashion'     },
  { value: 'tech',       label: 'Tech'        },
  { value: 'other',      label: 'Other'       },
]

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'
const labelClass = 'text-white/50 text-xs mb-1.5 block'

export default function SponsorsClient({ sponsors }: { sponsors: SponsorRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal]             = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing]         = useState<SponsorRow | null>(null)
  const [form, setForm]               = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast, setToast]             = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function set(field: keyof FormState, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setModal('add')
  }

  function openEdit(s: SponsorRow) {
    setEditing(s)
    setForm({
      name:                    s.name,
      logo_url:                s.logo_url                ?? '',
      website_url:             s.website_url             ?? '',
      description:             s.description             ?? '',
      discount_text:           s.discount_text           ?? '',
      discount_code:           s.discount_code           ?? '',
      redemption_instructions: s.redemption_instructions ?? '',
      members_only:            s.members_only,
      category:                s.category,
      is_featured:             s.is_featured,
      display_order:           String(s.display_order),
      status:                  s.status,
    })
    setModal('edit')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        name:                    form.name,
        logo_url:                form.logo_url                || null,
        website_url:             form.website_url             || null,
        description:             form.description             || null,
        discount_text:           form.discount_text           || null,
        discount_code:           form.discount_code           || null,
        redemption_instructions: form.redemption_instructions || null,
        members_only:            form.members_only,
        category:                form.category,
        is_featured:             form.is_featured,
        display_order:           parseInt(form.display_order, 10) || 0,
        status:                  form.status,
      }
      const result = editing
        ? await updateSponsor(editing.id, data)
        : await createSponsor(data)

      if (result.success) {
        setModal(null)
        router.refresh()
        showToast(editing ? 'Sponsor updated.' : 'Sponsor added.')
      } else {
        showToast(result.error ?? 'Failed to save sponsor.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSponsor(id)
      if (result.success) {
        setConfirmDelete(null)
        router.refresh()
        showToast('Sponsor deleted.')
      } else {
        showToast(result.error ?? 'Failed to delete.')
      }
    })
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-dark border border-white/20 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsors &amp; Partners</h1>
          <p className="text-white/40 text-sm mt-1">{sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
          + Add Sponsor
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {sponsors.length === 0 ? (
          <div className="p-12 text-center text-white/40">
            No sponsors yet. Add your first sponsor above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Sponsor</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Category</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Discount</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Featured</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Order</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Status</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {s.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logo_url} alt={s.name} className="w-9 h-9 rounded-lg object-contain bg-white/5 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
                          {s.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">{s.name}</p>
                        {s.website_url && (
                          <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                            {s.website_url.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/50 text-xs capitalize">{s.category.replace('_', ' ')}</span>
                  </td>
                  <td className="px-5 py-4">
                    {s.discount_text ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00' }}>
                        {s.discount_text}
                      </span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {s.is_featured ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-400 border border-orange-400/20 font-medium">Featured</span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/50 text-xs">{s.display_order}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      s.status === 'active'
                        ? 'text-green-400 bg-green-400/10 border-green-400/20'
                        : 'text-orange-400 bg-yellow-400/10 border-yellow-400/20'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-white/50 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s.id)}
                        className="text-red-400/70 hover:text-red-400 text-xs px-2.5 py-1 rounded-lg bg-red-400/5 hover:bg-red-400/10 transition-colors"
                      >
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

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-5">
              {modal === 'edit' ? 'Edit Sponsor' : 'Add Sponsor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input required className={inputClass} placeholder="e.g. Cool Brand" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Logo</label>
                <ImageUpload folder="sponsors" value={form.logo_url} onChange={url => set('logo_url', url)} />
              </div>
              <div>
                <label className={labelClass}>Website URL</label>
                <input className={inputClass} placeholder="https://..." value={form.website_url} onChange={e => set('website_url', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Short description" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Discount text</label>
                <input className={inputClass} placeholder="e.g. 10% off for members" value={form.discount_text} onChange={e => set('discount_text', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Discount code</label>
                <input className={inputClass} placeholder="e.g. BRAND10" value={form.discount_code} onChange={e => set('discount_code', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Redemption instructions</label>
                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="e.g. Show this code + member card at the venue" value={form.redemption_instructions} onChange={e => set('redemption_instructions', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value as SponsorCategory)}>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value as SponsorStatus)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Display order</label>
                  <input type="number" className={inputClass} min={0} value={form.display_order} onChange={e => set('display_order', e.target.value)} />
                </div>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={e => set('is_featured', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <span className="text-white/70 text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.members_only}
                      onChange={e => set('members_only', e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <span className="text-white/70 text-sm">Members only</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {isPending ? 'Saving…' : 'Save'}
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
            <p className="text-white font-semibold mb-2">Delete this sponsor?</p>
            <p className="text-white/50 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm bg-red-500/80 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-50">
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
