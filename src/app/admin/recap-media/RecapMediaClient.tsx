'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createRecapMedia, updateRecapMedia, deleteRecapMedia } from '@/app/actions/admin'
import VideoUpload from '@/components/admin/VideoUpload'
import ImageUpload from '@/components/admin/ImageUpload'
import type { PartyRecapMediaRow } from '@/types/database'

interface FormState {
  video_url:        string
  thumbnail_url:    string
  overlay_title:    string
  overlay_subtitle: string
  sort_order:       string
  city:             string
  is_active:        boolean
}

const EMPTY_FORM: FormState = {
  video_url:        '',
  thumbnail_url:    '',
  overlay_title:    '',
  overlay_subtitle: '',
  sort_order:       '0',
  city:             'Valencia',
  is_active:        true,
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'
const labelClass = 'text-white/50 text-xs mb-1.5 block'

export default function RecapMediaClient({ items }: { items: PartyRecapMediaRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal,         setModal]         = useState<'add' | 'edit' | null>(null)
  const [editing,       setEditing]       = useState<PartyRecapMediaRow | null>(null)
  const [form,          setForm]          = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast,         setToast]         = useState('')

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

  function openEdit(item: PartyRecapMediaRow) {
    setEditing(item)
    setForm({
      video_url:        item.video_url,
      thumbnail_url:    item.thumbnail_url    ?? '',
      overlay_title:    item.overlay_title    ?? '',
      overlay_subtitle: item.overlay_subtitle ?? '',
      sort_order:       String(item.sort_order),
      city:             item.city,
      is_active:        item.is_active,
    })
    setModal('edit')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.video_url) {
      showToast('Please upload a video first.')
      return
    }
    startTransition(async () => {
      const data = {
        video_url:        form.video_url,
        thumbnail_url:    form.thumbnail_url    || null,
        overlay_title:    form.overlay_title    || null,
        overlay_subtitle: form.overlay_subtitle || null,
        sort_order:       parseInt(form.sort_order, 10) || 0,
        city:             form.city || 'Valencia',
        is_active:        form.is_active,
      }
      const result = editing
        ? await updateRecapMedia(editing.id, data)
        : await createRecapMedia(data)

      if (result.success) {
        setModal(null)
        router.refresh()
        showToast(editing ? 'Video updated.' : 'Video added.')
      } else {
        showToast(result.error ?? 'Failed to save.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteRecapMedia(id)
      if (result.success) {
        setConfirmDelete(null)
        router.refresh()
        showToast('Video deleted.')
      } else {
        showToast(result.error ?? 'Failed to delete.')
      }
    })
  }

  function handleToggleActive(item: PartyRecapMediaRow) {
    startTransition(async () => {
      const result = await updateRecapMedia(item.id, { is_active: !item.is_active })
      if (result.success) {
        router.refresh()
        showToast(item.is_active ? 'Deactivated.' : 'Activated.')
      } else {
        showToast(result.error ?? 'Failed to update.')
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Party Recap</h1>
          <p className="text-white/40 text-sm mt-1">{items.length} video{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
          + Add Video
        </button>
      </div>

      {/* Grid */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-white/40">
            No videos yet. Add your first recap video above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Video</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Overlay</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">City</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Order</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Status</th>
                <th className="text-left text-white/40 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0" style={{ aspectRatio: '9/14' }}>
                        {item.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video
                            src={item.video_url}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="text-white/40 text-xs truncate max-w-[120px]">
                        {item.video_url.split('/').pop()}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {item.overlay_title ? (
                      <div>
                        <p className="text-white text-xs font-medium">{item.overlay_title}</p>
                        {item.overlay_subtitle && (
                          <p className="text-white/40 text-xs">{item.overlay_subtitle}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/50 text-xs">{item.city}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/50 text-xs">{item.sort_order}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      item.is_active
                        ? 'text-green-400 bg-green-400/10 border-green-400/20'
                        : 'text-orange-400 bg-yellow-400/10 border-yellow-400/20'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-white/50 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(item)}
                        disabled={isPending}
                        className="text-white/50 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
                      >
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(item.id)}
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
              {modal === 'edit' ? 'Edit Video' : 'Add Video'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Video *</label>
                <VideoUpload value={form.video_url} onChange={url => set('video_url', url)} />
              </div>
              <div>
                <label className={labelClass}>Thumbnail / poster frame (optional)</label>
                <ImageUpload folder="sponsors" value={form.thumbnail_url} onChange={url => set('thumbnail_url', url)} />
              </div>
              <div>
                <label className={labelClass}>Overlay title (optional)</label>
                <input
                  className={inputClass}
                  placeholder="e.g. TECHNO NIGHT"
                  value={form.overlay_title}
                  onChange={e => set('overlay_title', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Overlay subtitle (optional)</label>
                <input
                  className={inputClass}
                  placeholder="e.g. La Sala · 200 people"
                  value={form.overlay_subtitle}
                  onChange={e => set('overlay_subtitle', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    placeholder="Valencia"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Sort order</label>
                  <input
                    type="number"
                    className={inputClass}
                    min={0}
                    value={form.sort_order}
                    onChange={e => set('sort_order', e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-400"
                />
                <span className="text-white/70 text-sm">Active (visible on homepage)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
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
            <p className="text-white font-semibold mb-2">Delete this video?</p>
            <p className="text-white/50 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm bg-red-500/80 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
