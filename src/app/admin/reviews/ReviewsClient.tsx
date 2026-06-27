'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { setTestimonialVisible, deleteTestimonial } from '@/app/actions/admin'
import type { TestimonialRow } from '@/types/database'

const STARS = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function ReviewsClient({ items }: { items: TestimonialRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function toggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await setTestimonialVisible(id, !current)
      if (res.success) {
        showToast(current ? 'Hidden from site' : 'Now visible on site')
        router.refresh()
      } else {
        showToast(res.error ?? 'Error')
      }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteTestimonial(id)
      if (res.success) {
        showToast('Deleted')
        setConfirmDelete(null)
        router.refresh()
      } else {
        showToast(res.error ?? 'Error')
      }
    })
  }

  const visible = items.filter(i => i.is_visible)
  const hidden  = items.filter(i => !i.is_visible)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',   value: items.length },
          { label: 'Visible', value: visible.length },
          { label: 'Hidden',  value: hidden.length },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <p className="text-white/40 text-xs">{s.label}</p>
            <p className="text-white text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-white/40">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`glass-card rounded-2xl p-5 flex gap-4 transition-opacity ${!item.is_visible ? 'opacity-50' : ''}`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
                {item.first_name.charAt(0).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm">
                    {item.first_name} {item.last_name}
                  </p>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white/40 text-xs">{item.nationality}</span>
                  <span className="text-brand-accent text-xs tracking-tight">{STARS(item.rating)}</span>
                  {!item.is_visible && (
                    <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full">hidden</span>
                  )}
                </div>
                <p className="text-white/60 text-sm leading-relaxed line-clamp-2">{item.review_text}</p>
                <p className="text-white/25 text-xs mt-1">{new Date(item.created_at).toLocaleDateString('en-GB')}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggle(item.id, item.is_visible)}
                  disabled={isPending}
                  title={item.is_visible ? 'Hide from site' : 'Show on site'}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  {item.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => setConfirmDelete(item.id)}
                  disabled={isPending}
                  title="Delete"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold mb-2">Delete review?</h3>
            <p className="text-white/50 text-sm mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(confirmDelete)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-dark border border-white/10 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
