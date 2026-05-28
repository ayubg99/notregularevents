export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PricingCards from './PricingCards'
import type { MembershipPlan, MembershipRow } from '@/types/database'
import { CheckCircle, ShieldCheck, Zap } from 'lucide-react'

export const metadata = {
  title:       'Membership — Erasmus Vibe',
  description: 'Unlock your Valencia experience. Exclusive events, trip discounts, international dinners, and a professional network — open to all internationals.',
  openGraph: {
    title:       'Membership — Erasmus Vibe Valencia',
    description: 'Unlock your Valencia experience with exclusive access, trip discounts, and a professional network.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Membership — Erasmus Vibe',
    description: 'Unlock your Valencia experience — exclusive events, trip discounts, and a professional network.',
  },
}

const BENEFITS = [
  {
    icon:  '🎟️',
    title: 'Priority Event Access',
    desc:  'Get early access before tickets sell out to the general public.',
  },
  {
    icon:  '✈️',
    title: 'Trip Discounts',
    desc:  'Save on every trip with exclusive member-only pricing tiers.',
  },
  {
    icon:  '🌍',
    title: 'Meet People from 50+ Countries',
    desc:  'Join an exclusive international community right here in Valencia.',
  },
  {
    icon:  '🍽️',
    title: 'Monthly International Dinners',
    desc:  'Exclusive sit-down dinners for members only — new cuisines, new friends.',
  },
  {
    icon:  '💼',
    title: 'Professional Network in Valencia',
    desc:  'Connect with expats, entrepreneurs and professionals building careers here.',
  },
  {
    icon:  '💬',
    title: 'Private WhatsApp Groups',
    desc:  'Curated communities by nationality, interest and city area.',
  },
]

const TRUST = [
  { icon: <Zap size={16} />,         label: 'Instant activation' },
  { icon: <CheckCircle size={16} />, label: 'Cancel anytime'     },
  { icon: <ShieldCheck size={16} />, label: 'Open to all internationals' },
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(245,166,35,0.15),transparent)] pointer-events-none" />
        {/* Orbs */}
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full bg-brand-primary/12 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[420px] h-[420px] rounded-full bg-brand-accent/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Membership
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            Unlock Your<br />Valencia Experience
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Exclusive access, discounts, and a community that feels like home.
          </p>
        </div>
      </section>

      {/* ── Benefits grid ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-20 md:pt-20">
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

        <PricingCards currentPlan={currentPlan} isLoggedIn={!!user} />
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
