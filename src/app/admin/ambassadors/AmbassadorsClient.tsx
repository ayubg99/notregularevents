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
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'text-white border'
          : 'text-white/45 hover:text-white/75 hover:bg-white/5 border border-transparent'
      }`}
      style={active ? {
        background: 'linear-gradient(135deg, rgba(233,30,140,0.15) 0%, rgba(255,107,0,0.10) 100%)',
        borderColor: 'rgba(233,30,140,0.30)',
      } : undefined}
    >
      {label}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active
            ? 'text-white'
            : 'bg-white/10 text-white/40'
        }`}
          style={active ? { background: 'rgba(233,30,140,0.25)', color: '#E91E8C' } : undefined}
        >
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
    <div className="rounded-xl p-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.22), rgba(255,107,0,0.15))', border: '1px solid rgba(233,30,140,0.30)' }}
        >
          <span className="text-sm font-bold" style={{ color: '#E91E8C' }}>{getInitials(app.name, app.email)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold">{app.name}</p>
          <p className="text-white/40 text-sm">{app.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {app.university && (
              <span className="flex items-center gap-1 text-white/50 text-xs px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                🎓 {app.university}
              </span>
            )}
            {app.instagram && (
              <span className="flex items-center gap-1 text-white/50 text-xs px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                📷 {app.instagram}
              </span>
            )}
            <span className="text-white/25 text-xs flex items-center">
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(248,113,113,0.8)', border: '1px solid rgba(239,68,68,0.18)' }}
          >
            <X size={12} /> Reject
          </button>
        </div>
      </div>

      {/* Why join toggle */}
      {app.why_join && (
        <div className="mt-3 ml-15">
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-white/35 text-xs hover:text-white/60 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Read'} application message
          </button>
          {expanded && (
            <p className="mt-2 text-white/55 text-sm leading-relaxed border-l-2 pl-3 italic"
              style={{ borderColor: 'rgba(233,30,140,0.30)' }}>
              &ldquo;{app.why_join}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatChip({ icon, label, value, highlight }: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 px-3 py-2 rounded-xl flex-shrink-0"
      style={{
        background: highlight ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${highlight ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <p className={`font-bold text-base ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
      <p className="text-white/30 text-[10px] flex items-center gap-1">{icon} {label}</p>
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
    <div className="rounded-xl p-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.22), rgba(233,30,140,0.15))', border: '1px solid rgba(255,107,0,0.30)' }}
        >
          <span className="text-sm font-bold" style={{ color: '#FF6B00' }}>{getInitials(amb.user_name, amb.user_email)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold">{amb.user_name ?? amb.user_email ?? '—'}</p>
            <code className="text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.22)' }}>
              {amb.referral_code}
            </code>
          </div>
          <p className="text-white/35 text-sm">{amb.user_email}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-shrink-0">
          <StatChip icon={<Users size={9} />} label="Referrals" value={String(amb.total_referrals ?? 0)} />
          <StatChip icon={<TrendingUp size={9} />} label="Total" value={`€${(amb.total_earnings ?? 0).toFixed(2)}`} />
          <StatChip icon={<Clock size={9} />} label="Pending" value={`€${(amb.pending_earnings ?? 0).toFixed(2)}`} highlight={hasPending} />
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <label className="text-white/35 text-xs">Commission %</label>
          <input
            type="number" min="0" max="100"
            value={rate}
            onChange={e => { setRate(e.target.value); setSaved(false) }}
            className="w-14 px-2 py-1.5 rounded-lg text-white text-sm text-center focus:outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          />
          <button
            onClick={() => startTransition(async () => {
              const res = await updateAmbassadorCommissionRate(amb.id, parseFloat(rate))
              if (res.success) setSaved(true)
              else alert(res.error ?? 'Failed')
            })}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={saved
              ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.22)' }
              : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)' }
            }
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
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-25"
          style={{ background: 'rgba(34,197,94,0.10)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.22)' }}
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
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
          style={{ color: 'rgba(248,113,113,0.45)' }}
        >
          Deactivate
        </button>
      </div>
    </div>
  )
}

const RANK_STYLE: Record<number, { bg: string; color: string; label: string }> = {
  0: { bg: 'rgba(255,215,0,0.15)',  color: '#FFD700', label: '1st' },
  1: { bg: 'rgba(192,192,192,0.12)', color: '#C0C0C0', label: '2nd' },
  2: { bg: 'rgba(205,127,50,0.12)',  color: '#CD7F32', label: '3rd' },
}

export default function AmbassadorsClient({ applications, ambassadors, tab }: Props) {
  const pending   = applications.filter(a => a.status === 'pending')
  const totalOwed = ambassadors.reduce((s, a) => s + (a.pending_earnings ?? 0), 0)
  const owedAmbs  = ambassadors.filter(a => (a.pending_earnings ?? 0) > 0)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <TabLink label="Applications" count={pending.length} active={tab === 'applications'} href="?tab=applications" />
        <TabLink label="Active"       count={ambassadors.length} active={tab === 'active'}       href="?tab=active"       />
        <TabLink label="Payouts"      active={tab === 'payouts'}       href="?tab=payouts"      />
      </div>

      {/* Applications */}
      {tab === 'applications' && (
        <div className="flex flex-col gap-3">
          {pending.length === 0 ? (
            <div className="rounded-xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-white/40 text-sm font-medium">No pending applications</p>
              <p className="text-white/20 text-xs mt-1">New applications will appear here for review</p>
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
            <div className="rounded-xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-white/40 text-sm font-medium">No active ambassadors yet</p>
              <p className="text-white/20 text-xs mt-1">Approve applications from the Applications tab</p>
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
          <div className="rounded-2xl p-5 mb-5 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(255,107,0,0.05) 100%)',
              border: '1px solid rgba(34,197,94,0.18)',
              boxShadow: '0 0 32px rgba(34,197,94,0.06)',
            }}
          >
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Total pending payouts</p>
              <p className="font-heading text-4xl font-bold text-green-400">€{totalOwed.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-sm font-medium">
                {owedAmbs.length} ambassador{owedAmbs.length !== 1 ? 's' : ''} owed
              </p>
              <p className="text-white/25 text-xs mt-1">Use Active tab to mark individual payments</p>
            </div>
          </div>

          {owedAmbs.length === 0 ? (
            <div className="rounded-xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-white/40 text-sm font-medium">All ambassadors paid up</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {owedAmbs
                .sort((a, b) => (b.pending_earnings ?? 0) - (a.pending_earnings ?? 0))
                .map((amb, i) => {
                  const rank = RANK_STYLE[i]
                  return (
                    <div key={amb.id}
                      className="rounded-xl px-4 py-3.5 flex items-center gap-4 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {/* Rank badge */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={rank
                          ? { background: rank.bg, color: rank.color, border: `1px solid ${rank.color}30` }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' }
                        }
                      >
                        {rank ? rank.label : i + 1}
                      </div>

                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.25)' }}
                      >
                        <span className="text-xs font-bold" style={{ color: '#FF6B00' }}>{getInitials(amb.user_name, amb.user_email)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{amb.user_name ?? amb.user_email ?? '—'}</p>
                        <code className="text-xs" style={{ color: 'rgba(255,107,0,0.55)' }}>{amb.referral_code}</code>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-green-400 font-bold text-lg">€{(amb.pending_earnings ?? 0).toFixed(2)}</p>
                        <p className="text-white/25 text-xs">{amb.total_referrals ?? 0} referrals</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
