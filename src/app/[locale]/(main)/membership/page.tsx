export const dynamic = 'force-dynamic'

import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getPublicClient } from '@/lib/supabase/public'
import { Link } from '@/i18n/navigation'
import PricingCards from './PricingCards'
import type { MembershipPlan, MembershipRow, SponsorRow } from '@/types/database'
import { CheckCircle, ShieldCheck, Zap } from 'lucide-react'

export const metadata = {
  title:       'Membership — Not Regular Events',
  description: 'The Not Regular Events membership. Discounts, exclusive events and the best nightlife experiences in Madrid.',
}

export default async function MembershipPage() {
  const t        = await getTranslations('membership')

  const BENEFITS = [
    { icon: '🎟️', title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: '⚡',  title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: '🎉', title: t('benefit3Title'), desc: t('benefit3Desc') },
    { icon: '💬', title: t('benefit4Title'), desc: t('benefit4Desc') },
    { icon: '🏠', title: t('benefit5Title'), desc: t('benefit5Desc') },
    { icon: '🎁', title: t('benefit6Title'), desc: t('benefit6Desc') },
  ]

  const TRUST = [
    { icon: <Zap size={16} />,         label: t('trustInstant') },
    { icon: <CheckCircle size={16} />, label: t('trustCancel')  },
    { icon: <ShieldCheck size={16} />, label: t('trustFor')     },
  ]

  const PLAN_LABELS: Record<MembershipPlan, string> = {
    basic:    t('planMonthly'),
    premium:  t('planSemester'),
    vip:      t('planAnnual'),
    employer: 'Employer',
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let membership: MembershipRow | null = null
  if (user) {
    const { data } = await supabase.from('memberships').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle()
    membership = data as MembershipRow | null
  }

  const pub = getPublicClient()
  const { data: sponsorsData } = await pub.from('sponsors').select('*').eq('status', 'active').not('discount_text', 'is', null).order('display_order', { ascending: true })
  const sponsors = (sponsorsData ?? []) as SponsorRow[]

  const currentPlan = membership?.plan ?? null

  return (
    <div className="min-h-screen bg-brand-dark">
      <section className="relative overflow-hidden pt-32 pb-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,107,0,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full bg-brand-primary/12 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[420px] h-[420px] rounded-full bg-brand-accent/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">{t('pageTitle')}</span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            Not Regular Events<br />Membership
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            {t('pageSubtitle')}
          </p>
        </div>
      </section>

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

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-3">{t('chooseYourPlan')}</h2>
          <p className="text-white/50 text-sm">{t('allPlansInclude')}</p>
        </div>

        {currentPlan && (
          <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/30 px-5 py-4">
            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm font-medium">
              {t.rich('currentPlanMsg', {
                plan: PLAN_LABELS[currentPlan],
                b:    (chunks) => <span className="font-bold">{chunks}</span>,
                link: (chunks) => <Link href="/dashboard" className="underline hover:text-green-200 transition-colors">{chunks}</Link>,
              })}
            </p>
          </div>
        )}

        <PricingCards currentPlan={currentPlan} isLoggedIn={!!user} />
      </section>

      <section className="border-t border-white/5 py-10 px-4">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          {TRUST.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/40 text-sm">
              <span className="text-white/30">{icon}</span>{label}
            </div>
          ))}
        </div>
      </section>

      {sponsors.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-white mb-2">{t('memberDiscountsTitle')}</h2>
            <p className="text-white/50 text-sm">{t('memberDiscountsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sponsors.map(sponsor => (
              <div key={sponsor.id} className="glass-card rounded-2xl p-5 text-center flex flex-col items-center">
                <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', justifyContent:'center', height:'72px', width:'100%', marginBottom:'12px' }}>
                  {sponsor.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sponsor.logo_url} alt={sponsor.name} style={{ maxHeight:44, maxWidth:120, width:'auto', objectFit:'contain' }} />
                  ) : (
                    <p className="text-white font-bold text-sm text-center leading-tight">{sponsor.name}</p>
                  )}
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full mb-2" style={{ background:'rgba(255,107,0,0.15)', color:'#FF6B00' }}>{sponsor.discount_text}</span>
                {sponsor.description && <p className="text-white/40 text-xs leading-relaxed mb-2">{sponsor.description}</p>}
                {sponsor.discount_code && (
                  (currentPlan === 'premium' || currentPlan === 'vip') ? (
                    <div className="w-full mt-1 rounded-lg p-2" style={{ background:'rgba(255,255,255,0.04)' }}>
                      <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">{t('yourCode')}</p>
                      <p className="font-mono font-bold text-sm" style={{ color:'#FF6B00' }}>{sponsor.discount_code}</p>
                    </div>
                  ) : (
                    <div className="w-full mt-1 rounded-lg p-2 text-center" style={{ background:'rgba(255,255,255,0.03)' }}>
                      <p className="text-white/20 text-xs">{t('semesterOnly')}</p>
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
