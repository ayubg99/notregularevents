import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { getPublicClient } from '@/lib/supabase/public'

export const dynamic = 'force-dynamic'

export const metadata = {
  title:       'About — Not Regular Events',
  description: 'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid.',
  openGraph: {
    title:       'About — Not Regular Events',
    description: 'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'About — Not Regular Events',
    description: 'Not Regular Events — the best nightlife community in Madrid.',
  },
}

const PHOTO_GRADIENTS = [
  'from-brand-primary/40 to-brand-accent/20',
  'from-purple-500/30 to-brand-primary/20',
  'from-brand-accent/30 to-emerald-500/20',
  'from-emerald-500/20 to-brand-primary/30',
  'from-orange-500/20 to-brand-accent/30',
  'from-brand-primary/20 to-purple-500/30',
]

async function getSitePhotos() {
  try {
    const supabase = getPublicClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('site_settings')
      .select('key, value')
      .in('key', ['about_main_photo', 'about_community_photos'])
    const map: Record<string, unknown> = {}
    for (const row of (data ?? [])) map[row.key] = row.value
    return {
      mainPhoto:       typeof map.about_main_photo === 'string' ? map.about_main_photo : null,
      communityPhotos: Array.isArray(map.about_community_photos) ? (map.about_community_photos as string[]) : [],
    }
  } catch {
    return { mainPhoto: null, communityPhotos: [] }
  }
}

export default async function AboutPage() {
  const [t, { mainPhoto, communityPhotos }] = await Promise.all([
    getTranslations('about'),
    getSitePhotos(),
  ])

  const TEAM = [
    { name: 'Leadership',     role: t('roleLeadership'), nationality: '🇪🇸', emoji: '🌟' },
    { name: 'Events Team',    role: t('roleEvents'),     nationality: '🎉', emoji: '🎉' },
    { name: 'Trips Team',     role: t('roleTrips'),      nationality: '🌍', emoji: '✈️' },
    { name: 'Community Team', role: t('roleCommunity'),  nationality: '💬', emoji: '💬' },
  ]

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-44 md:pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,107,0,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-brand-primary/12 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-brand-accent/8 blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center mb-12">
          <span className="inline-block text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">
            {t('label')}
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-gradient mb-5 leading-tight">
            {t('heading')}
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Main photo */}
        <div className="relative max-w-4xl mx-auto rounded-2xl aspect-video overflow-hidden">
          {mainPhoto ? (
            <Image src={mainPhoto} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-primary/30 via-brand-primary/10 to-brand-accent/20 flex items-center justify-center">
              <div className="absolute inset-0 opacity-30"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, var(--color-brand-primary) 0%, transparent 60%), radial-gradient(circle at 70% 40%, var(--color-brand-accent) 0%, transparent 50%)' }}
              />
              <p className="relative text-white/40 text-sm font-medium">{t('photoSoon')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="flex flex-col gap-6 text-white/65 text-base leading-relaxed">
          <p>{t('story1')}</p>
          <p>{t('story2')}</p>
          <p>{t('story3')}</p>
        </div>
      </section>

      {/* ── Mission statement ─────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <blockquote className="border-l-4 border-brand-primary pl-6">
          <p className="font-heading text-2xl sm:text-3xl font-bold italic text-white leading-snug">
            &ldquo;{t('quote')}&rdquo;
          </p>
        </blockquote>
      </section>

      {/* ── Team grid ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="font-heading text-3xl font-bold text-white text-center mb-10">{t('teamHeading')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEAM.map((member) => (
            <div key={member.name} className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-accent/20 flex items-center justify-center text-3xl">
                {member.emoji}
              </div>
              <div>
                <p className="font-heading font-bold text-white text-sm">{member.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{member.role}</p>
                <p className="text-lg mt-1">{member.nationality}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Community photo grid ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <h2 className="font-heading text-3xl font-bold text-white text-center mb-10">{t('communityHeading')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PHOTO_GRADIENTS.map((gradient, i) => {
            const url = communityPhotos[i]
            return url ? (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div
                key={i}
                className={`aspect-square rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
              >
                <span className="text-white/20 text-xs font-medium">{t('photoLabel', { n: i + 1 })}</span>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
