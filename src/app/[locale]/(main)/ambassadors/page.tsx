import ApplicationForm from './ApplicationForm'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata = {
  title:       'Promoters — Not Regular Events',
  description: 'Want to be a promoter for Not Regular Events? Join our team in Madrid. Earn commission, get exclusive access and grow with us.',
  openGraph: {
    title:       'Want To Be A Promoter? — Not Regular Events',
    description: 'Join our promoter team in Madrid. Earn commission and help grow the most exclusive nightlife community in the city.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Promoters — Not Regular Events',
    description: 'Join our promoter team in Madrid. Earn commissions and exclusive access.',
  },
}

const BENEFITS = [
  {
    emoji: '💰',
    title: '5% Commission',
    desc:  'Earn 5% on every booking made with your referral code — trips, events, and more.',
  },
  {
    emoji: '🎁',
    title: 'Milestone Rewards',
    desc:  'Free tickets, upgrades & cash bonuses as you hit referral milestones.',
  },
  {
    emoji: '🌟',
    title: 'Exclusive Access',
    desc:  'Promoter-only events and a private community of Not Regular Events promoters.',
  },
]

const STEPS = [
  {
    number: '01',
    title:  'Apply',
    desc:   'Fill in the application form below. Takes less than 3 minutes.',
  },
  {
    number: '02',
    title:  'Get Verified',
    desc:   'We review every application personally and get back to you within 48 hours.',
  },
  {
    number: '03',
    title:  'Start Earning',
    desc:   'Receive your referral code, share it with friends, and watch commissions roll in.',
  },
]

export default function AmbassadorsPage() {
  return (
    <div className="min-h-screen bg-brand-dark pt-20">
      <PageHeader tag="// Work With Us" title="Want To Be A Promoter?" />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/15 via-brand-dark to-brand-primary/10 pointer-events-none" />
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-32 w-72 h-72 rounded-full bg-brand-primary/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            Promoters
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            Want To Be A Promoter?
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Passionate about Madrid&apos;s nightlife and want to be part of our team? We&apos;re looking for energetic people with good connections and the drive to help grow the most exclusive community in the city.
          </p>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <span className="text-4xl leading-none">{b.emoji}</span>
              <div>
                <p className="font-heading font-bold text-white text-base mb-1.5">{b.title}</p>
                <p className="text-white/45 text-sm leading-relaxed">{b.desc}</p>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="font-heading text-3xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex gap-6">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-brand-primary/15 border border-brand-primary/40 flex items-center justify-center flex-shrink-0">
                  <span className="font-heading font-bold text-brand-primary text-sm">{step.number}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-px flex-1 bg-white/10 my-2" />
                )}
              </div>
              {/* Content */}
              <div className={`pb-${i < STEPS.length - 1 ? '10' : '0'} pt-1.5 flex-1`}>
                <p className="font-heading font-bold text-white text-base mb-1">{step.title}</p>
                <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Application form ──────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-24">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl font-bold text-white mb-2">Ready to Join?</h2>
          <p className="text-white/45 text-sm">Ready to be part of something not regular? Send us your info and we&apos;ll be in touch.</p>
        </div>
        <ApplicationForm />
      </section>

    </div>
  )
}
