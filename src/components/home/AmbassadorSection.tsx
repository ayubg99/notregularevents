import Link from 'next/link'
import { TrendingUp, Gift, Users } from 'lucide-react'

const PERKS = [
  { icon: TrendingUp, label: '5% commission',    desc: 'On every booking made with your code'   },
  { icon: Gift,       label: 'Milestone rewards', desc: 'Free tickets, upgrades & cash bonuses'  },
  { icon: Users,      label: 'Exclusive access',  desc: 'Ambassador-only events and community'   },
]

export default function AmbassadorSection() {
  return (
    <section className="py-24 bg-[var(--bg-base)] relative overflow-hidden">

      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-brand-primary/6 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(45,91,255,0.07) 0%, rgba(45,91,255,0.04) 50%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(45,91,255,0.15)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left — copy */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <p className="text-brand-primary text-sm font-bold uppercase tracking-widest mb-4">
                Ambassador Program
              </p>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
                Share Not Regular Events.<br />
                <span className="text-brand-primary">Earn Real Money.</span>
              </h2>
              <p className="text-white/55 text-lg leading-relaxed mb-8">
                Love Not Regular Events? Tell your friends and earn 5% commission on every event they book — plus exclusive rewards the more you grow.
              </p>

              <div className="flex flex-col gap-4 mb-10">
                {PERKS.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(45,91,255,0.12)', border: '1px solid rgba(45,91,255,0.2)' }}>
                      <Icon size={16} className="text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{label}</p>
                      <p className="text-white/40 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/ambassadors"
                className="inline-flex items-center gap-2 px-8 py-4 rounded font-bold text-base text-white self-start hover:brightness-110 transition-all"
                style={{ background: 'var(--accent-blue)' }}
              >
                Apply to be an Ambassador →
              </Link>
            </div>

            {/* Right — visual card */}
            <div className="p-8 md:p-12 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-white/6">
              <div className="w-full max-w-xs flex flex-col gap-4">

                {/* Mock referral link card */}
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(45,91,255,0.2)' }}>
                  <p className="text-brand-primary text-xs font-bold uppercase tracking-widest mb-2">Your Referral Link</p>
                  <p className="text-brand-primary/70 text-xs font-mono break-all">notregularevents.com?ref=<span className="text-brand-primary font-bold">SOFIA1234</span></p>
                  <p className="text-white/30 text-xs mt-2">Share anywhere and earn automatically</p>
                </div>

                {/* Mock stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '12',    label: 'Referrals' },
                    { value: '€43',   label: 'Earned'    },
                    { value: '€21',   label: 'Pending'   },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-white font-bold font-heading text-lg">{s.value}</p>
                      <p className="text-white/30 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Milestone */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex justify-between mb-2">
                    <p className="text-white text-xs font-semibold">Next: 25 referrals</p>
                    <p className="text-brand-primary text-xs font-bold">12/25</p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full w-[48%]" style={{ background: '#2D5BFF' }} />
                  </div>
                  <p className="text-white/30 text-xs mt-1.5">💶 €50 cash bonus at 25</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
