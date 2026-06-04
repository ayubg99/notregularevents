'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createHousingPartner, updateHousingPartner, deleteHousingPartner, togglePartnerStatus } from '@/app/actions/admin'
import type { HousingPartnerRow, HousingPartnerStatus } from '@/types/database'

interface PartnerWithCount extends HousingPartnerRow {
  room_count: number
}

interface FormState {
  name:          string
  contact_name:  string
  contact_email: string
  contact_phone: string
  whatsapp:      string
  description:   string
  logo_url:      string
  status:        HousingPartnerStatus
}

const EMPTY_FORM: FormState = {
  name: '', contact_name: '', contact_email: '',
  contact_phone: '', whatsapp: '', description: '',
  logo_url: '', status: 'active',
}

const inputClass  = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'
const labelClass  = 'text-white/50 text-xs mb-1.5 block'

export default function PartnersClient({ partners }: { partners: PartnerWithCount[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal]   = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<HousingPartnerRow | null>(null)
  const [form, setForm]     = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast, setToast]   = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setModal('add')
  }

  function openEdit(p: HousingPartnerRow) {
    setEditing(p)
    setForm({
      name:          p.name,
      contact_name:  p.contact_name,
      contact_email: p.contact_email,
      contact_phone: p.contact_phone ?? '',
      whatsapp:      p.whatsapp ?? '',
      description:   p.description ?? '',
      logo_url:      p.logo_url ?? '',
      status:        p.status,
    })
    setModal('edit')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        name:          form.name,
        contact_name:  form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone || null,
        whatsapp:      form.whatsapp      || null,
        description:   form.description   || null,
        logo_url:      form.logo_url      || null,
        status:        form.status,
      }
      const result = editing
        ? await updateHousingPartner(editing.id, data)
        : await createHousingPartner(data)

      if (result.success) {
        setModal(null)
        router.refresh()
        showToast(editing ? 'Partner updated.' : 'Partner added.')
      } else {
        showToast(result.error ?? 'Failed to save partner.')
      }
    })
  }

  function handleToggleStatus(p: HousingPartnerRow) {
    startTransition(async () => {
      const newStatus: HousingPartnerStatus = p.status === 'active' ? 'inactive' : 'active'
      const result = await togglePartnerStatus(p.id, newStatus)
      if (result.success) router.refresh()
      else showToast(result.error ?? 'Failed to update status.')
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteHousingPartner(id)
      if (result.success) {
        setConfirmDelete(null)
        router.refresh()
        showToast('Partner deleted.')
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
          <h1 className="text-2xl font-bold text-white">Verified Partners</h1>
          <p className="text-white/40 text-sm mt-1">{partners.length} partner{partners.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/housing-partners/contacts"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors border border-white/10"
          >
            View Contacts
          </Link>
          <button
            onClick={openAdd}
            className="btn-primary px-4 py-2 rounded-xl text-sm font-medium"
          >
            + Add Partner
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {partners.length === 0 ? (
          <div className="p-12 text-center text-white/40">
            No partners yet. Add your first verified partner above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Partner</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Contact</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Rooms</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Status</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logo_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
                          {p.name[0]}
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white/70 text-sm">{p.contact_name}</p>
                    <p className="text-white/40 text-xs">{p.contact_email}</p>
                    {p.contact_phone && <p className="text-white/40 text-xs">{p.contact_phone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/housing-partners/${p.id}`}
                      className="text-brand-accent text-sm hover:underline"
                    >
                      {p.room_count} room{p.room_count !== 1 ? 's' : ''} →
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      disabled={isPending}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        p.status === 'active'
                          ? 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20'
                          : 'text-orange-400 bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/20'
                      }`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-white/50 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
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
              {modal === 'edit' ? 'Edit Partner' : 'Add Partner'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Partner / agency name *</label>
                <input required className={inputClass} placeholder="e.g. Valencia Rooms" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contact person *</label>
                  <input required className={inputClass} placeholder="First Last" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Contact email *</label>
                  <input required type="email" className={inputClass} placeholder="landlord@email.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contact phone</label>
                  <input className={inputClass} placeholder="+34 600 000 000" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp number</label>
                  <input className={inputClass} placeholder="+34 600 000 000" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Short description of the partner" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Logo URL</label>
                <input className={inputClass} placeholder="https://..." value={form.logo_url} onChange={e => set('logo_url', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
            <p className="text-white font-semibold mb-2">Delete this partner?</p>
            <p className="text-white/50 text-sm mb-6">All their rooms will also be deleted.</p>
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
