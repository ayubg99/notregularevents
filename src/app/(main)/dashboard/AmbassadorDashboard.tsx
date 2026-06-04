'use client'

import { useState } from 'react'
import { Copy, Check, TrendingUp, Clock, Users } from 'lucide-react'
import type { AmbassadorRow, AmbassadorCommissionRow, AmbassadorRewardRow } from '@/types/database'

interface Props {
  ambassador:  AmbassadorRow
  commissions: AmbassadorCommissionRow[]
  rewards:     AmbassadorRewardRow[]
}

const MILESTONES = [5, 10, 25, 50] as const
const MILESTONE_INFO: Record<number, { label: string; icon: string; color: string }> = {
  5:  { label: 'Free event ticket',        icon: '🎟️', color: 'text-cyan-400'     },
  10: { label: 'Free membership upgrade',  icon: '👑', color: 'text-purple-400'   },
  25: { label: '€50 cash bonus',           icon: '💶', color: 'text-green-400'    },
  50: { label: '€150 cash bonus',          icon: '🏆', color: 'text-brand-accent' },
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-3">{children}</p>
  )
}

export default function AmbassadorDashboard({ ambassador, commissions, rewards }: Props) {
  const [copied, setCopied] = useState(false)

  const baseUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const referralUrl = `${baseUrl}?ref=${ambassador.referral_code}`

  const totalReferrals  = ambassador.total_referrals  ?? 0
  const totalEarnings   = ambassador.total_earnings   ?? 0
  const pendingEarnings = ambassador.pending_earnings ?? 0

  const nextMilestone = MILESTONES.find(m => m > totalReferrals) ?? null
  const prevMilestone = nextMilestone ? (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0) : null
  const progress = nextMilestone
    ? ((totalReferrals - (prevMilestone ?? 0)) / (nextMilestone - (prevMilestone ?? 0))) * 100
    : 100

  function copyLink() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.22), rgba(233,30,140,0.12))', border: '1px solid rgba(255,107,0,0.32)' }}>
          🌟
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-white">Ambassador Dashboard</h2>
          <p className="text-white/40 text-xs">Referral code: <span className="text-brand-accent font-mono font-bold">{ambassador.referral_code}</span></p>
        </div>
      </div>

      {/* Referral link */}
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.08), rgba(233,30,140,0.04))', border: '1px solid rgba(255,107,0,0.2)' }}>
        <p className="text-brand-accent text-[10px] font-bold uppercase tracking-widest mb-3">Your Referral Link</p>
        <div className="flex gap-2 items-center mb-3">
          <div className="flex-1 rounded-xl px-3 py-2.5 min-w-0"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-brand-accent text-sm font-mono truncate">{referralUrl}</p>
          </div>
          <button onClick={copyLink}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: copied ? 'rgba(46,204,113,0.2)' : 'linear-gradient(135deg, #FF6B00, #E91E8C)', color: copied ? '#2ECC71' : '#1A1A0E' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-white/35 text-xs">
          Share anywhere — you earn <span className="text-brand-accent font-semibold">{ambassador.commission_rate ?? 5}% commission</span> on every booking made with your code.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Users size={13} />, color: 'text-cyan-400', bg: 'rgba(78,205,196,0.07)', border: 'rgba(78,205,196,0.18)', value: String(totalReferrals), label: 'Referrals' },
          { icon: <TrendingUp size={13} />, color: 'text-brand-accent', bg: 'rgba(255,107,0,0.07)', border: 'rgba(255,107,0,0.18)', value: `€${totalEarnings.toFixed(2)}`, label: 'Total earned' },
          { icon: <Clock size={13} />, color: 'text-green-400', bg: 'rgba(46,204,113,0.07)', border: 'rgba(46,204,113,0.18)', value: `€${pendingEarnings.toFixed(2)}`, label: 'Pending payout' },
        ].map(({ icon, color, bg, border, value, label }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className={`${color} opacity-60 flex justify-center mb-2`}>{icon}</div>
            <p className={`text-xl font-bold font-heading ${color}`}>{value}</p>
            <p className="text-white/35 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Next milestone */}
      {nextMilestone && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-white text-sm font-semibold">Next milestone</p>
              <p className="text-white/40 text-xs mt-0.5">
                {MILESTONE_INFO[nextMilestone].icon} {MILESTONE_INFO[nextMilestone].label}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold font-heading ${MILESTONE_INFO[nextMilestone].color}`}>
                {totalReferrals}<span className="text-white/25 text-sm font-normal">/{nextMilestone}</span>
              </p>
              <p className="text-white/30 text-xs">{nextMilestone - totalReferrals} to go</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg, #FF6B00, #E91E8C)' }}
            />
          </div>
        </div>
      )}

      {/* All milestones legend */}
      <div className="grid grid-cols-4 gap-2">
        {MILESTONES.map(m => {
          const done = totalReferrals >= m
          const info = MILESTONE_INFO[m]
          return (
            <div key={m} className="rounded-xl p-3 text-center transition-all"
              style={{
                background: done ? 'rgba(255,107,0,0.08)' : 'rgba(255,255,255,0.02)',
                border: done ? '1px solid rgba(255,107,0,0.25)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-base mb-1">{done ? '✅' : info.icon}</p>
              <p className={`text-xs font-bold ${done ? 'text-brand-accent' : 'text-white/30'}`}>{m} refs</p>
              <p className={`text-[10px] mt-0.5 leading-tight ${done ? 'text-white/50' : 'text-white/20'}`}>
                {info.label.split(' ').slice(0, 2).join(' ')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Rewards */}
      {rewards.length > 0 && (
        <div>
          <SectionHeading>Your Rewards</SectionHeading>
          <div className="flex flex-col gap-2">
            {rewards.map(reward => (
              <div key={reward.id} className="rounded-xl px-4 py-3 flex justify-between items-center"
                style={{
                  background: reward.status === 'pending' ? 'rgba(255,107,0,0.07)' : 'rgba(255,255,255,0.02)',
                  border: reward.status === 'pending' ? '1px solid rgba(255,107,0,0.25)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <p className="text-white text-sm font-semibold">{reward.description}</p>
                  {reward.expires_at && (
                    <p className="text-white/35 text-xs mt-0.5">
                      Expires {new Date(reward.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                  reward.status === 'pending'  ? 'bg-brand-accent/15 text-brand-accent' :
                  reward.status === 'claimed'  ? 'bg-green-500/15 text-green-400' :
                                                 'bg-white/8 text-white/30'
                }`}>
                  {reward.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commission history */}
      <div>
        <SectionHeading>Commission History</SectionHeading>
        {commissions.length === 0 ? (
          <div className="rounded-xl p-8 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/40 text-sm font-medium">No commissions yet</p>
            <p className="text-white/20 text-xs mt-1">Share your referral link to start earning</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {commissions.map((c, i) => (
              <div key={c.id}
                className="flex justify-between items-center px-4 py-3 relative"
                style={{
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.015)',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                }}
              >
                {/* Status bar on left edge */}
                <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                  style={{ background: c.status === 'paid' ? 'rgba(74,222,128,0.5)' : 'rgba(255,107,0,0.6)' }} />
                <div className="pl-2">
                  <p className="text-white text-sm font-semibold">{c.event_title ?? 'Booking'}</p>
                  <p className="text-white/35 text-xs mt-0.5 capitalize">
                    {c.booking_type} · {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-green-400 font-bold text-sm">+€{c.commission_earned.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${c.status === 'paid' ? 'text-green-400/55' : 'text-brand-accent/70'}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
