'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react'
import DataTable from '@/components/admin/DataTable'
import type { PromoCodeRow, PromoCodeInsert, PromoCodeUpdate, DiscountType, PromoAppliesTo } from '@/types/database'

type PromoTableRow = PromoCodeRow & Record<string, unknown>
type PromoStatus   = 'active' | 'expired' | 'exhausted'

interface FormState {
  code:           string
  discount_type:  DiscountType
  discount_value: string
  applies_to:     PromoAppliesTo
  uses_limited:   boolean
  uses_remaining: string
  has_expiry:     boolean
  expires_at:     string
}

const defaultForm = (): FormState => ({
  code:           '',
  discount_type:  'percentage',
  discount_value: '',
  applies_to:     'both',
  uses_limited:   false,
  uses_remaining: '',
  has_expiry:     false,
  expires_at:     '',
})

const SHORTCUTS: { label: string; values: Partial<FormState> }[] = [
  { label: '10% Welcome', values: { code: 'WELCOME10', discount_type: 'percentage', discount_value: '10' } },
  { label: '€5 Off',      values: { code: 'SAVE5',     discount_type: 'fixed',      discount_value: '5'  } },
  { label: '20% VIP',     values: { code: 'VIP20',     discount_type: 'percentage', discount_value: '20' } },
  { label: 'Free (100%)', values: { code: 'FREE100',   discount_type: 'percentage', discount_value: '100'} },
]

const STATUS_COLORS: Record<PromoStatus, { bg: string; color: string; label: string }> = {
  active:    { bg: 'rgba(46,204,113,0.13)',  color: '#2ECC71', label: 'Active'    },
  expired:   { bg: 'rgba(136,136,136,0.13)', color: '#888888', label: 'Expired'   },
  exhausted: { bg: 'rgba(255,68,68,0.13)',   color: '#FF4444', label: 'Exhausted' },
}

function computeStatus(row: PromoCodeRow): PromoStatus {
  if (row.uses_remaining !== null && row.uses_remaining <= 0) return 'exhausted'
  if (row.expires_at && new Date(row.expires_at) < new Date()) return 'expired'
  return 'active'
}

function StatusBadge({ row }: { row: PromoCodeRow }) {
  const status = computeStatus(row)
  const { bg, color, label } = STATUS_COLORS[status]
  return (
    <span style={{
      background:   bg,
      color,
      padding:      '2px 9px',
      borderRadius: '9999px',
      fontSize:     '11px',
      fontWeight:   700,
    }}>
      {label}
    </span>
  )
}

function TypeBadge({ type }: { type: DiscountType }) {
  const isPercent = type === 'percentage'
  return (
    <span style={{
      background:   isPercent ? 'rgba(78,205,196,0.15)'  : 'rgba(233,30,140,0.15)',
      color:        isPercent ? '#4ECDC4'                 : '#E91E8C',
      padding:      '2px 8px',
      borderRadius: '9999px',
      fontSize:     '11px',
      fontWeight:   700,
    }}>
      {isPercent ? '%' : '€'}
    </span>
  )
}

interface Props { promoCodes: PromoCodeRow[] }

export default function PromoCodesClient({ promoCodes }: Props) {
  const router = useRouter()
  const [modal,    setModal]    = useState<'create' | 'edit' | null>(null)
  const [editing,  setEditing]  = useState<PromoCodeRow | null>(null)
  const [form,     setForm]     = useState<FormState>(defaultForm())
  const [toast,    setToast]    = useState('')
  const [isPending, startTransition] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function openCreate(prefill?: Partial<FormState>) {
    setEditing(null)
    setForm({ ...defaultForm(), ...prefill })
    setToast('')
    setModal('create')
  }

  function openEdit(row: PromoCodeRow) {
    setEditing(row)
    setForm({
      code:           row.code,
      discount_type:  row.discount_type,
      discount_value: String(row.discount_value),
      applies_to:     row.applies_to ?? 'both',
      uses_limited:   row.uses_remaining !== null,
      uses_remaining: row.uses_remaining !== null ? String(row.uses_remaining) : '',
      has_expiry:     row.expires_at !== null,
      expires_at:     row.expires_at ? row.expires_at.slice(0, 16) : '',
    })
    setToast('')
    setModal('edit')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const code = form.code.trim()
    if (!code) { showToast('Code is required.'); return }
    if (!/^[A-Z0-9]+$/.test(code)) { showToast('Code must contain only uppercase letters and numbers.'); return }

    const value = parseFloat(form.discount_value)
    if (!form.discount_value || isNaN(value) || value <= 0) { showToast('Discount value must be greater than 0.'); return }
    if (form.discount_type === 'percentage' && value > 100) { showToast('Percentage discount cannot exceed 100%.'); return }

    if (form.uses_limited && (!form.uses_remaining || parseInt(form.uses_remaining, 10) < 1)) {
      showToast('Uses limit must be at least 1.')
      return
    }
    if (form.has_expiry && !form.expires_at) {
      showToast('Please select an expiry date.')
      return
    }

    const payload: PromoCodeInsert = {
      code,
      discount_type:  form.discount_type,
      discount_value: value,
      applies_to:     form.applies_to,
      uses_remaining: form.uses_limited ? parseInt(form.uses_remaining, 10) : null,
      expires_at:     form.has_expiry && form.expires_at
                        ? new Date(form.expires_at).toISOString()
                        : null,
    }

    startTransition(async () => {
      if (modal === 'edit' && editing) {
        const updatePayload: PromoCodeUpdate = payload
        const res  = await fetch(`/api/admin/promo-codes/${editing.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(updatePayload),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) { showToast(data.error ?? 'Failed to update code.'); return }
      } else {
        const res  = await fetch('/api/admin/promo-codes', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) { showToast(data.error ?? 'Failed to create code.'); return }
      }
      setModal(null)
      router.refresh()
    })
  }

  function handleDelete(row: PromoCodeRow) {
    if (!confirm(`Delete promo code "${row.code}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/promo-codes/${row.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        showToast(data.error ?? 'Failed to delete code.')
        return
      }
      router.refresh()
    })
  }

  type PromoCol = { key: string; header: string; sortable?: boolean; render?: (row: PromoTableRow) => React.ReactNode }

  const columns: PromoCol[] = [
    {
      key:    'code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-white tracking-wide">
          {row.code as string}
        </span>
      ),
    },
    {
      key:    'discount_type',
      header: 'Type',
      render: (row) => <TypeBadge type={row.discount_type as DiscountType} />,
    },
    {
      key:    'discount_value',
      header: 'Value',
      render: (row) => row.discount_type === 'percentage'
        ? `${row.discount_value}%`
        : `€${Number(row.discount_value).toFixed(2)}`,
    },
    {
      key:    'applies_to',
      header: 'Applies To',
      render: (row) => {
        const val = (row.applies_to as PromoAppliesTo) ?? 'both'
        const label = val === 'both' ? 'Events & Trips' : val === 'events' ? 'Events only' : 'Trips only'
        const color = val === 'both' ? '#888' : val === 'events' ? '#4ECDC4' : '#FF6B00'
        return <span style={{ color, fontSize: '12px', fontWeight: 600 }}>{label}</span>
      },
    },
    {
      key:    'uses_remaining',
      header: 'Uses Left',
      render: (row) => row.uses_remaining === null
        ? <span className="text-white/40 text-xs">Unlimited</span>
        : <span>{row.uses_remaining as number}</span>,
    },
    {
      key:    'expires_at',
      header: 'Expires',
      sortable: true,
      render: (row) => row.expires_at === null
        ? <span className="text-white/40 text-xs">Never</span>
        : new Date(row.expires_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      key:    '_status',
      header: 'Status',
      render: (row) => <StatusBadge row={row as unknown as PromoCodeRow} />,
    },
  ]

  const inputClass  = 'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'
  const labelClass  = 'text-white/50 text-xs mb-1.5 block'
  const toggleClass = (active: boolean) =>
    `px-3 py-1 rounded-md text-xs font-semibold transition-all ${
      active ? 'bg-brand-primary text-white' : 'text-white/40 hover:text-white/70'
    }`

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Promo Codes</h1>
          <p className="text-white/40 text-sm mt-0.5">{promoCodes.length} total codes</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:brightness-110 text-white text-sm font-semibold transition-all"
        >
          <Plus size={15} />
          New Promo Code
        </button>
      </div>

      {/* Quick create shortcuts */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-white/30 text-xs self-center mr-1">Quick create:</span>
        {SHORTCUTS.map(s => (
          <button
            key={s.label}
            onClick={() => openCreate(s.values)}
            className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 text-xs font-medium transition-all"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table or empty state */}
      {promoCodes.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Tag className="mx-auto text-white/20 mb-4" size={48} />
          <h3 className="font-heading text-lg font-bold text-white/40 mb-1">No promo codes yet</h3>
          <p className="text-white/25 text-sm">Create your first code to start offering discounts.</p>
        </div>
      ) : (
        <DataTable
          data={promoCodes as unknown as PromoTableRow[]}
          columns={columns}
          searchKeys={['code'] as (keyof PromoTableRow)[]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => openEdit(row as unknown as PromoCodeRow)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(row as unknown as PromoCodeRow)}
                className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-dark border border-white/15 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-heading font-bold text-white text-lg">
                {modal === 'create' ? 'New Promo Code' : 'Edit Promo Code'}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

              {/* Code */}
              <div>
                <label className={labelClass}>Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                  placeholder="WELCOME10"
                  className={`${inputClass} font-mono tracking-wide uppercase`}
                />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type *</label>
                  <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, discount_type: 'percentage' }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${toggleClass(form.discount_type === 'percentage')}`}
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, discount_type: 'fixed' }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${toggleClass(form.discount_type === 'fixed')}`}
                    >
                      € Fixed
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Value * {form.discount_type === 'percentage' ? '(%)' : '(€)'}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                    required
                    placeholder={form.discount_type === 'percentage' ? '10' : '5'}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Applies to */}
              <div>
                <label className={labelClass}>Applies To *</label>
                <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5">
                  {(['both', 'events', 'trips'] as PromoAppliesTo[]).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, applies_to: opt }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${toggleClass(form.applies_to === opt)}`}
                    >
                      {opt === 'both' ? 'Events & Trips' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uses limit */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={labelClass} style={{ marginBottom: 0 }}>Uses Limit</span>
                  <div className="flex gap-0.5 rounded-lg bg-white/5 border border-white/10 p-0.5">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, uses_limited: false, uses_remaining: '' }))}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${toggleClass(!form.uses_limited)}`}
                    >
                      Unlimited
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, uses_limited: true }))}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${toggleClass(form.uses_limited)}`}
                    >
                      Limited
                    </button>
                  </div>
                </div>
                {form.uses_limited && (
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.uses_remaining}
                    onChange={e => setForm(f => ({ ...f, uses_remaining: e.target.value }))}
                    placeholder="Number of uses"
                    className={inputClass}
                  />
                )}
              </div>

              {/* Expiry */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={labelClass} style={{ marginBottom: 0 }}>Expiry Date</span>
                  <div className="flex gap-0.5 rounded-lg bg-white/5 border border-white/10 p-0.5">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, has_expiry: false, expires_at: '' }))}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${toggleClass(!form.has_expiry)}`}
                    >
                      Never
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, has_expiry: true }))}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${toggleClass(form.has_expiry)}`}
                    >
                      Set Date
                    </button>
                  </div>
                </div>
                {form.has_expiry && (
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </div>

              {/* Toast */}
              {toast && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {toast}
                </p>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-brand-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                >
                  {isPending ? 'Saving…' : modal === 'create' ? 'Create Code' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global pending overlay toast */}
      {isPending && !modal && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm">
          Saving…
        </div>
      )}
    </>
  )
}
