'use client'

import { useState, useTransition } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import {
  approveAmbassadorApplication,
  rejectAmbassadorApplication,
  markAmbassadorPaid,
  updateAmbassadorCommissionRate,
  deactivateAmbassador,
} from '@/app/actions/ambassador'
import type { AmbassadorApplicationRow, AmbassadorRow } from '@/types/database'

type AmbassadorWithUser = AmbassadorRow & {
  user_email: string | null
  user_name:  string | null
}

interface Props {
  applications: AmbassadorApplicationRow[]
  ambassadors:  AmbassadorWithUser[]
  tab:          string
}

function TabLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-amber-500/20 text-amber-400 border border-amber-400/25'
          : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </a>
  )
}

function ApplicationRow({ app }: { app: AmbassadorApplicationRow }) {
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  if (done) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/2 p-4 text-white/40 text-sm">
        Application {done} — {app.name}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{app.name}</p>
          <p className="text-white/50 text-sm">{app.email}</p>
          <div className="flex flex-wrap gap-3 mt-1">
            {app.university && <span className="text-white/40 text-xs">🎓 {app.university}</span>}
            {app.instagram  && <span className="text-white/40 text-xs">📷 {app.instagram}</span>}
          </div>
          <p className="text-white/30 text-xs mt-1">
            Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => startTransition(async () => {
              const res = await approveAmbassadorApplication(app.id, app.name, app.email)
              if (res.success) setDone('approved')
              else alert(res.error ?? 'Failed to approve')
            })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-bold hover:bg-green-500/25 transition-colors disabled:opacity-50"
          >
            <Check size={12} />
            Approve
          </button>
          <button
            onClick={() => startTransition(async () => {
              const res = await rejectAmbassadorApplication(app.id)
              if (res.success) setDone('rejected')
              else alert(res.error ?? 'Failed to reject')
            })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/25 transition-colors disabled:opacity-50"
          >
            <X size={12} />
            Reject
          </button>
        </div>
      </div>
      {app.why_join && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Read'} application
          </button>
          {expanded && (
            <p className="mt-2 text-white/60 text-sm leading-relaxed border-l-2 border-white/10 pl-3">
              {app.why_join}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ActiveRow({ amb }: { amb: AmbassadorWithUser }) {
  const [isPending, startTransition] = useTransition()
  const [rate, setRate] = useState(String(amb.commission_rate ?? 5))
  const [deactivated, setDeactivated] = useState(false)
  const [markedPaid, setMarkedPaid] = useState(false)

  if (deactivated) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/2 p-4 text-white/40 text-sm">
        Deactivated — {amb.user_name ?? amb.user_email}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-semibold">{amb.user_name ?? amb.user_email ?? '—'}</p>
          <p className="text-white/50 text-sm">{amb.user_email}</p>
          <code className="text-brand-accent text-xs bg-brand-accent/10 px-2 py-0.5 rounded mt-1 inline-block">
            {amb.referral_code}
          </code>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-white font-bold">{amb.total_referrals ?? 0}</p>
            <p className="text-white/40 text-xs">Referrals</p>
          </div>
          <div>
            <p className="text-brand-accent font-bold">€{(amb.total_earnings ?? 0).toFixed(2)}</p>
            <p className="text-white/40 text-xs">Total</p>
          </div>
          <div>
            <p className="text-green-400 font-bold">€{(amb.pending_earnings ?? 0).toFixed(2)}</p>
            <p className="text-white/40 text-xs">Pending</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/6">
        <div className="flex items-center gap-2">
          <label className="text-white/40 text-xs">Commission %</label>
          <input
            type="number"
            value={rate}
            onChange={e => setRate(e.target.value)}
            className="w-14 px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white text-sm text-center focus:outline-none focus:border-brand-primary/50"
          />
          <button
            onClick={() => startTransition(async () => {
              const res = await updateAmbassadorCommissionRate(amb.id, parseFloat(rate))
              if (!res.success) alert(res.error ?? 'Failed')
            })}
            disabled={isPending}
            className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-xs hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
        <button
          onClick={() => startTransition(async () => {
            const res = await markAmbassadorPaid(amb.id)
            if (res.success) setMarkedPaid(true)
            else alert(res.error ?? 'Failed')
          })}
          disabled={isPending || (amb.pending_earnings ?? 0) === 0}
          className="px-3 py-1 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-bold hover:bg-green-500/25 transition-colors disabled:opacity-40"
        >
          {markedPaid ? '✓ Marked Paid' : 'Mark as Paid'}
        </button>
        <button
          onClick={() => {
            if (!confirm('Deactivate this ambassador?')) return
            startTransition(async () => {
              const res = await deactivateAmbassador(amb.id)
              if (res.success) setDeactivated(true)
              else alert(res.error ?? 'Failed')
            })
          }}
          disabled={isPending}
          className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400/70 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-50 ml-auto"
        >
          Deactivate
        </button>
      </div>
    </div>
  )
}

export default function AmbassadorsClient({ applications, ambassadors, tab }: Props) {
  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabLink label={`Applications (${applications.filter(a => a.status === 'pending').length})`} active={tab === 'applications'} href="?tab=applications" />
        <TabLink label={`Active (${ambassadors.length})`}    active={tab === 'active'}       href="?tab=active"       />
        <TabLink label="Payouts"                             active={tab === 'payouts'}       href="?tab=payouts"      />
      </div>

      {tab === 'applications' && (
        <div className="flex flex-col gap-3">
          {applications.filter(a => a.status === 'pending').length === 0 ? (
            <p className="text-white/40 text-sm">No pending applications.</p>
          ) : (
            applications.filter(a => a.status === 'pending').map(app => (
              <ApplicationRow key={app.id} app={app} />
            ))
          )}
        </div>
      )}

      {tab === 'active' && (
        <div className="flex flex-col gap-3">
          {ambassadors.length === 0 ? (
            <p className="text-white/40 text-sm">No active ambassadors yet.</p>
          ) : (
            ambassadors.map(amb => <ActiveRow key={amb.id} amb={amb} />)
          )}
        </div>
      )}

      {tab === 'payouts' && (
        <div>
          <p className="text-white/40 text-sm mb-4">Summary of pending payouts across all ambassadors.</p>
          {ambassadors.filter(a => (a.pending_earnings ?? 0) > 0).length === 0 ? (
            <p className="text-white/40 text-sm">No pending payouts.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {ambassadors
                .filter(a => (a.pending_earnings ?? 0) > 0)
                .sort((a, b) => (b.pending_earnings ?? 0) - (a.pending_earnings ?? 0))
                .map(amb => (
                  <div key={amb.id} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">{amb.user_name ?? amb.user_email ?? '—'}</p>
                      <code className="text-brand-accent text-xs">{amb.referral_code}</code>
                    </div>
                    <p className="text-green-400 font-bold text-lg">€{(amb.pending_earnings ?? 0).toFixed(2)}</p>
                  </div>
                ))}
              <div className="rounded-xl border border-brand-accent/25 bg-brand-accent/5 px-4 py-3 flex justify-between items-center mt-2">
                <p className="text-brand-accent font-bold">Total pending</p>
                <p className="text-brand-accent font-bold text-xl">
                  €{ambassadors.reduce((sum, a) => sum + (a.pending_earnings ?? 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
