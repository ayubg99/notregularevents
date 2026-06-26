export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getPublicClient } from '@/lib/supabase/public'
import PricingCards from './PricingCards'
import type { MembershipPlan, MembershipRow, SponsorRow } from '@/types/database'
import { CheckCircle, ShieldCheck, Zap } from 'lucide-react'

export const metadata = {
  title:       'Membership — Not Regular Events',
  description: 'The Not Regular Events membership. Discounts, exclusive events and the best nightlife experiences in Madrid.',
  openGraph: {
    title:       'Membership — Not Regular Events',
    description: 'Get more from every night out in Madrid. Discounts, exclusive events and the full Not Regular Events experience.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Membership — Not Regular Events',
    description: 'The Not Regular Events membership — discounts, exclusive events and the best nightlife in Madrid.',
  },
}

const BENEFITS = [
  {
    icon:  '🎟️',
    title: '10% Off All Events & Trips',
    desc:  'Save on every event ticket and trip booking.',
  },
  {
    icon:  '⚡',
    title: 'Priority Trip Booking',
    desc:  'Get early access before popular trips sell out.',
  },
  {
    icon:  '🎉',
    title: 'Free Exclusive Member Events',
    desc:  'Access to events only available to members.',
  },
  {
    icon:  '💬',
    title: 'Private Community WhatsApp Groups',
    desc:  'Curated groups for Not Regular Events members in Madrid.',
  },
  {
    icon:  '🏠',
    title: 'Housing Contact Details',
    desc:  'See landlord contacts directly — no middleman.',
  },
  {
    icon:  '🎁',
    title: 'Partner Discounts in Madrid',
    desc:  'Exclusive deals with our partner businesses.',
  },
]

const TRUST = [
  { icon: <Zap size={16} />,         label: 'Instant activation' },
  { icon: <CheckCircle size={16} />, label: 'Cancel anytime'     },
  { icon: <ShieldCheck size={16} />, label: 'Students & night owls' },
]

const PLAN_LABELS: Record<MembershipPlan, string> = {
  basic:    'Monthly',
  premium:  'Semester',
  vip:      'Annual',
  employer: 'Employer',
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

  const pub = getPublicClient()
  const { data: sponsorsData } = await pub
    .from('sponsors')
    .select('*')
    .eq('status', 'active')
    .not('discount_text', 'is', null)
    .order('display_order', { ascending: true })
  const sponsors = (sponsorsData ?? []) as SponsorRow[]

  const currentPlan = membership?.plan ?? null

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 px-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,107,0,0.15),transparent)] pointer-events-none" />
        {/* Orbs */}
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full bg-brand-primary/12 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[420px] h-[420px] rounded-full bg-brand-accent/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Membership
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            Not Regular Events<br />Membership
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Get more from every night out in Madrid. Discounts, exclusive events and the full Not Regular Events experience.
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

      {/* ── Partner Discounts ─────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-white mb-2">Member Discounts</h2>
            <p className="text-white/50 text-sm">Exclusive deals with our partners</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sponsors.map(sponsor => (
              <div
                key={sponsor.id}
                className="glass-card rounded-2xl p-5 text-center flex flex-col items-center"
              >
                {/* Logo container */}
                <div style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '72px',
                  width: '100%',
                  marginBottom: '12px',
                }}>
                  {sponsor.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      style={{ maxHeight: 44, maxWidth: 120, width: 'auto', objectFit: 'contain' }}
                    />
                  ) : (
                    <p className="text-white font-bold text-sm text-center leading-tight">{sponsor.name}</p>
                  )}
                </div>
                {/* Discount badge */}
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full mb-2"
                  style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}
                >
                  {sponsor.discount_text}
                </span>
                {/* Description */}
                {sponsor.description && (
                  <p className="text-white/40 text-xs leading-relaxed mb-2">{sponsor.description}</p>
                )}
                {/* Discount code — members only */}
                {sponsor.discount_code && (
                  (currentPlan === 'premium' || currentPlan === 'vip') ? (
                    <div className="w-full mt-1 rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Your code</p>
                      <p className="font-mono font-bold text-sm" style={{ color: '#FF6B00' }}>{sponsor.discount_code}</p>
                    </div>
                  ) : (
                    <div className="w-full mt-1 rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-white/20 text-xs">
                        {currentPlan === 'basic' ? '⬆️ Semester+ only' : '🔒 Semester+ only'}
                      </p>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
