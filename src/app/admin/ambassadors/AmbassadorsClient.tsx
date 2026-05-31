'use client'

import { useState, useTransition } from 'react'
import { Check, X, ChevronDown, ChevronUp, TrendingUp, Clock, Users, DollarSign } from 'lucide-react'
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

function TabLink({ label, count, active, href }: { label: string; count?: number; active: boolean; href: string }) {
  return (
    <a href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-amber-500/20 text-amber-400 border border-amber-400/25'
          : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-white/40'
        }`}>
          {count}
        </span>
      )}
    </a>
  )
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (email) return email[0].toUpperCase()
  return '?'
}

function ApplicationRow({ app }: { app: AmbassadorApplicationRow }) {
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  if (done) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/2 px-4 py-3 text-white/30 text-sm italic">
        Application {done} — {app.name}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center flex-shrink-0">
          <span className="text-brand-primary text-sm font-bold">{getInitials(app.name, app.email)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{app.name}</p>
          <p className="text-white/40 text-sm">{app.email}</p>
          <div className="flex flex-wrap gap-3 mt-1.5">
            {app.university && (
              <span className="flex items-center gap-1 text-white/35 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                🎓 {app.university}
              </span>
            )}
            {app.instagram && (
              <span className="flex items-center gap-1 text-white/35 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                📷 {app.instagram}
              </span>
            )}
            <span className="text-white/25 text-xs">
              {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => startTransition(async () => {
              const res = await approveAmbassadorApplication(app.id, app.name, app.email)
              if (res.success) setDone('approved')
              else alert(res.error ?? 'Failed to approve')
            })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 text-xs font-bold hover:bg-green-500/25 transition-colors disabled:opacity-50"
          >
            <Check size={12} /> Approve
          </button>
          <button
            onClick={() => startTransition(async () => {
              const res = await rejectAmbassadorApplication(app.id)
              if (res.success) setDone('rejected')
              else alert(res.error ?? 'Failed to reject')
            })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400/80 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <X size={12} /> Reject
          </button>
        </div>
      </div>

      {/* Why join toggle */}
      {app.why_join && (
        <div className="mt-3 ml-14">
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-white/35 text-xs hover:text-white/60 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Read'} application message
          </button>
          {expanded && (
            <p className="mt-2 text-white/55 text-sm leading-relaxed border-l-2 border-white/10 pl-3 italic">
              &ldquo;{app.why_join}&rdquo;
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
  const [saved, setSaved] = useState(false)

  if (deactivated) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/2 px-4 py-3 text-white/30 text-sm italic">
        Deactivated — {amb.user_name ?? amb.user_email}
      </div>
    )
  }

  const hasPending = (amb.pending_earnings ?? 0) > 0

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center flex-shrink-0">
          <span className="text-brand-accent text-sm font-bold">{getInitials(amb.user_name, amb.user_email)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold">{amb.user_name ?? amb.user_email ?? '—'}</p>
            <code className="text-brand-accent text-xs bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded-md font-mono">
              {amb.referral_code}
            </code>
          </div>
          <p className="text-white/35 text-sm">{amb.user_email}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 flex-shrink-0 text-right">
          <div>
            <p className="text-white font-bold text-lg">{amb.total_referrals ?? 0}</p>
            <p className="text-white/30 text-xs flex items-center gap-1 justify-end"><Users size={10} /> Referrals</p>
          </div>
          <div>
            <p className="text-brand-accent font-bold text-lg">€{(amb.total_earnings ?? 0).toFixed(2)}</p>
            <p className="text-white/30 text-xs flex items-center gap-1 justify-end"><TrendingUp size={10} /> Total</p>
          </div>
          <div>
            <p className={`font-bold text-lg ${hasPending ? 'text-green-400' : 'text-white/20'}`}>
              €{(amb.pending_earnings ?? 0).toFixed(2)}
            </p>
            <p className="text-white/30 text-xs flex items-center gap-1 justify-end"><Clock size={10} /> Pending</p>
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/6">
        <div className="flex items-center gap-2">
          <label className="text-white/35 text-xs">Commission %</label>
          <input
            type="number" min="0" max="100"
            value={rate}
            onChange={e => { setRate(e.target.value); setSaved(false) }}
            className="w-14 px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm text-center focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
          <button
            onClick={() => startTransition(async () => {
              const res = await updateAmbassadorCommissionRate(amb.id, parseFloat(rate))
              if (res.success) setSaved(true)
              else alert(res.error ?? 'Failed')
            })}
            disabled={isPending}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              saved ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-white/60 hover:bg-white/12'
            }`}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        <button
          onClick={() => startTransition(async () => {
            const res = await markAmbassadorPaid(amb.id)
            if (res.success) setMarkedPaid(true)
            else alert(res.error ?? 'Failed')
          })}
          disabled={isPending || !hasPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/12 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500/20 transition-colors disabled:opacity-30"
        >
          <DollarSign size={11} />
          {markedPaid ? '✓ Paid' : `Mark €${(amb.pending_earnings ?? 0).toFixed(2)} as Paid`}
        </button>

        <button
          onClick={() => {
            if (!confirm(`Deactivate ${amb.user_name ?? amb.user_email}?`)) return
            startTransition(async () => {
              const res = await deactivateAmbassador(amb.id)
              if (res.success) setDeactivated(true)
              else alert(res.error ?? 'Failed')
            })
          }}
          disabled={isPending}
          className="ml-auto px-3 py-1.5 rounded-lg text-red-400/50 text-xs hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-30"
        >
          Deactivate
        </button>
      </div>
    </div>
  )
}

export default function AmbassadorsClient({ applications, ambassadors, tab }: Props) {
  const pending   = applications.filter(a => a.status === 'pending')
  const totalOwed = ambassadors.reduce((s, a) => s + (a.pending_earnings ?? 0), 0)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/6 pb-4">
        <TabLink label="Applications" count={pending.length} active={tab === 'applications'} href="?tab=applications" />
        <TabLink label="Active"       count={ambassadors.length} active={tab === 'active'}       href="?tab=active"       />
        <TabLink label="Payouts"      active={tab === 'payouts'}       href="?tab=payouts"      />
      </div>

      {/* Applications */}
      {tab === 'applications' && (
        <div className="flex flex-col gap-3">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-white/6 bg-white/2 p-10 text-center">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-white/40 text-sm">No pending applications</p>
            </div>
          ) : (
            pending.map(app => <ApplicationRow key={app.id} app={app} />)
          )}
        </div>
      )}

      {/* Active */}
      {tab === 'active' && (
        <div className="flex flex-col gap-3">
          {ambassadors.length === 0 ? (
            <div className="rounded-xl border border-white/6 bg-white/2 p-10 text-center">
              <p className="text-2xl mb-2">🌟</p>
              <p className="text-white/40 text-sm">No active ambassadors yet</p>
              <p className="text-white/25 text-xs mt-1">Approve applications from the Applications tab</p>
            </div>
          ) : (
            ambassadors.map(amb => <ActiveRow key={amb.id} amb={amb} />)
          )}
        </div>
      )}

      {/* Payouts */}
      {tab === 'payouts' && (
        <div>
          {/* Summary card */}
          <div className="rounded-xl p-5 mb-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(46,204,113,0.08), rgba(245,166,35,0.04))', border: '1px solid rgba(46,204,113,0.2)' }}
          >
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Total pending payouts</p>
              <p className="font-heading text-3xl font-bold text-green-400">€{totalOwed.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-sm">{ambassadors.filter(a => (a.pending_earnings ?? 0) > 0).length} ambassador{ambassadors.filter(a => (a.pending_earnings ?? 0) > 0).length !== 1 ? 's' : ''} owed</p>
              <p className="text-white/25 text-xs mt-0.5">Use Active tab to mark individual payments</p>
            </div>
          </div>

          {ambassadors.filter(a => (a.pending_earnings ?? 0) > 0).length === 0 ? (
            <div className="rounded-xl border border-white/6 bg-white/2 p-10 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-white/40 text-sm">All ambassadors paid up</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {ambassadors
                .filter(a => (a.pending_earnings ?? 0) > 0)
                .sort((a, b) => (b.pending_earnings ?? 0) - (a.pending_earnings ?? 0))
                .map((amb, i) => (
                  <div key={amb.id}
                    className="rounded-xl border border-white/7 bg-white/2 px-4 py-3.5 flex items-center gap-4"
                  >
                    <span className="text-white/20 text-sm font-mono w-5 text-right flex-shrink-0">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-brand-accent/15 border border-brand-accent/25 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-accent text-xs font-bold">{getInitials(amb.user_name, amb.user_email)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{amb.user_name ?? amb.user_email ?? '—'}</p>
                      <code className="text-brand-accent/60 text-xs">{amb.referral_code}</code>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-green-400 font-bold text-lg">€{(amb.pending_earnings ?? 0).toFixed(2)}</p>
                      <p className="text-white/25 text-xs">{amb.total_referrals ?? 0} referrals</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
