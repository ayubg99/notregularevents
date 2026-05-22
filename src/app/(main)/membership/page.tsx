import { createClient } from '@/lib/supabase/server'
import PricingCards from './PricingCards'
import type { MembershipPlan, MembershipRow } from '@/types/database'
import { CheckCircle, ShieldCheck, Zap } from 'lucide-react'

export const metadata = {
  title:       'Membership — Erasmus Vibe',
  description: 'Unlock the full Erasmus experience with exclusive access, discounts, and a community that feels like home.',
  openGraph: {
    title:       'Membership — Erasmus Vibe Valencia',
    description: 'Unlock the full Erasmus experience with exclusive access, discounts, and a community.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Membership — Erasmus Vibe',
    description: 'Unlock the full Erasmus experience.',
  },
}

const BENEFITS = [
  {
    icon:  '🎟️',
    title: 'Priority Event Access',
    desc:  'Get early access to tickets before they sell out to the general public.',
  },
  {
    icon:  '✈️',
    title: 'Trip Discounts',
    desc:  'Save on every trip booking with exclusive member-only pricing tiers.',
  },
  {
    icon:  '🎉',
    title: 'Members-Only Parties',
    desc:  'Access secret events and exclusive parties not listed publicly.',
  },
  {
    icon:  '💬',
    title: 'Private WhatsApp Groups',
    desc:  'Join curated WhatsApp communities by nationality, interest, and city.',
  },
  {
    icon:  '🤝',
    title: 'Student Partner Discounts',
    desc:  'Unlock deals at Valencia bars, restaurants, and shops via our partners.',
  },
  {
    icon:  '🏆',
    title: 'VIP Treatment',
    desc:  'Skip queues, get reserved spots, and receive priority service at events.',
  },
]

const TRUST = [
  { icon: <Zap size={16} />,         label: 'Instant activation' },
  { icon: <CheckCircle size={16} />, label: 'Cancel anytime'     },
  { icon: <ShieldCheck size={16} />, label: 'Student-verified platform' },
]

const PLAN_LABELS: Record<MembershipPlan, string> = {
  basic:   'Monthly',
  premium: 'Semester',
  vip:     'Annual',
}

export default async function MembershipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let membership: MembershipRow | null = null
  if (user) {
    const { data } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    membership = data as MembershipRow | null
  }

  const currentPlan = membership?.plan ?? null

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 px-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-brand-dark to-brand-accent/10 pointer-events-none" />
        {/* Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-brand-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Membership
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            Unlock the Full<br />Erasmus Experience
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Exclusive access, discounts, and a community that feels like home.
          </p>
        </div>
      </section>

      {/* ── Benefits grid ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-3xl leading-none">{b.icon}</span>
              <div>
                <p className="font-heading font-bold text-white text-sm mb-1">{b.title}</p>
                <p className="text-white/40 text-xs leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-3">
            Choose Your Plan
          </h2>
          <p className="text-white/50 text-sm">All plans include full community access. Upgrade or cancel anytime.</p>
        </div>

        {/* Active membership banner */}
        {currentPlan && (
          <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/30 px-5 py-4">
            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm font-medium">
              You&apos;re currently on the <span className="font-bold">{PLAN_LABELS[currentPlan]}</span> plan.
              Manage your subscription in your{' '}
              <a href="/dashboard" className="underline hover:text-green-200 transition-colors">dashboard</a>.
            </p>
          </div>
        )}

        <PricingCards currentPlan={currentPlan} />
      </section>

      {/* ── Trust strip ───────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-10 px-4">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          {TRUST.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/40 text-sm">
              <span className="text-white/30">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
