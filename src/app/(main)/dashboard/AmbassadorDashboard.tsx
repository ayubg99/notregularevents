'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { AmbassadorRow, AmbassadorCommissionRow, AmbassadorRewardRow } from '@/types/database'

interface Props {
  ambassador:  AmbassadorRow
  commissions: AmbassadorCommissionRow[]
  rewards:     AmbassadorRewardRow[]
}

const MILESTONES = [5, 10, 25, 50] as const
const MILESTONE_LABELS: Record<number, string> = {
  5:  '🎟️ Free ticket',
  10: '👑 Free membership upgrade',
  25: '💶 €50 cash bonus',
  50: '💶 €150 cash bonus',
}

export default function AmbassadorDashboard({ ambassador, commissions, rewards }: Props) {
  const [copied, setCopied] = useState(false)

  const baseUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const referralUrl = `${baseUrl}?ref=${ambassador.referral_code}`

  const totalReferrals  = ambassador.total_referrals  ?? 0
  const totalEarnings   = ambassador.total_earnings   ?? 0
  const pendingEarnings = ambassador.pending_earnings ?? 0

  const nextMilestone = MILESTONES.find(m => m > totalReferrals) ?? null

  function copyLink() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="glass-card rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌟</span>
        <h2 className="font-heading text-lg font-bold text-white">Ambassador Dashboard</h2>
      </div>

      {/* Referral link */}
      <div className="rounded-xl border border-brand-accent/25 bg-brand-accent/5 p-4">
        <p className="text-brand-accent text-xs font-bold uppercase tracking-widest mb-2">Your Referral Link</p>
        <div className="flex gap-2 items-center flex-wrap">
          <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-brand-accent text-xs break-all">
            {referralUrl}
          </code>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-accent text-[#1A1A0E] text-xs font-bold hover:brightness-110 transition-all"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-white/40 text-xs mt-2">
          Share this link — you earn {ambassador.commission_rate ?? 5}% commission on every booking.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Referrals',     value: String(totalReferrals),                color: 'text-cyan-400'        },
          { label: 'Total earned',  value: `€${totalEarnings.toFixed(2)}`,        color: 'text-brand-accent'    },
          { label: 'Pending payout',value: `€${pendingEarnings.toFixed(2)}`,      color: 'text-green-400'       },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-white/6 bg-white/3 p-3 text-center">
            <p className={`text-xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
            <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Next milestone progress */}
      {nextMilestone && (
        <div className="rounded-xl border border-white/6 bg-white/3 p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white text-sm font-semibold">Next milestone: {nextMilestone} referrals</p>
            <p className="text-brand-accent text-sm font-bold">{totalReferrals}/{nextMilestone}</p>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width:      `${Math.min((totalReferrals / nextMilestone) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #F5A623, #FF6B35)',
              }}
            />
          </div>
          <p className="text-white/40 text-xs mt-2">{MILESTONE_LABELS[nextMilestone]}</p>
        </div>
      )}

      {/* Rewards */}
      {rewards.length > 0 && (
        <div>
          <h3 className="text-white text-sm font-bold mb-2">🎁 Your Rewards</h3>
          <div className="flex flex-col gap-2">
            {rewards.map(reward => (
              <div
                key={reward.id}
                className={`rounded-xl border p-3 flex justify-between items-center ${
                  reward.status === 'pending'
                    ? 'border-brand-accent/25 bg-brand-accent/5'
                    : 'border-white/6 bg-white/2'
                }`}
              >
                <div>
                  <p className="text-white text-sm font-semibold">{reward.description}</p>
                  {reward.expires_at && (
                    <p className="text-white/40 text-xs mt-0.5">
                      Expires {new Date(reward.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                  reward.status === 'pending'  ? 'bg-brand-accent/15 text-brand-accent' :
                  reward.status === 'claimed'  ? 'bg-green-500/15 text-green-400'       :
                                                 'bg-white/10 text-white/40'
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
        <h3 className="text-white text-sm font-bold mb-2">📋 Commission History</h3>
        {commissions.length === 0 ? (
          <div className="rounded-xl border border-white/6 bg-white/2 p-6 text-center">
            <p className="text-white/40 text-sm">No commissions yet. Share your link to start earning!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {commissions.map(c => (
              <div key={c.id} className="rounded-xl border border-white/6 bg-white/2 px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-semibold">{c.event_title ?? 'Booking'}</p>
                  <p className="text-white/40 text-xs mt-0.5 capitalize">
                    {c.booking_type} · {new Date(c.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-sm">+€{c.commission_earned.toFixed(2)}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-brand-accent/15 text-brand-accent'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
