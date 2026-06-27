import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPublicClient } from '@/lib/supabase/public'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Community | Not Regular Events Madrid',
  description: 'Join the Not Regular Events community in Madrid. Connect with students and night owls, find flatmates, join WhatsApp groups and discover events.',
}

const GROUP_DEFS = [
  { key: 'wg_student',  icon: '💬', titleKey: 'studentCommunityTitle' as const, descKey: 'studentCommunityDesc' as const },
  { key: 'wg_party',   icon: '🎉', titleKey: 'partyGroupTitle'        as const, descKey: 'partyGroupDesc'        as const },
  { key: 'wg_housing', icon: '🏠', titleKey: 'housingGroupTitle'      as const, descKey: 'housingGroupDesc'      as const },
]

async function getWhatsappUrls(): Promise<Record<string, string>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (getPublicClient() as any)
      .from('site_settings')
      .select('key, value')
      .eq('key', 'whatsapp_groups')
      .maybeSingle()
    return (data?.value as Record<string, string>) ?? {}
  } catch {
    return {}
  }
}

export default async function CommunityPage() {
  const [t, urls] = await Promise.all([getTranslations('community'), getWhatsappUrls()])

  const GROUPS = GROUP_DEFS.map(g => ({ ...g, link: urls[g.key] || '#' }))

  return (
    <div className="min-h-screen bg-brand-dark">
      <section className="relative overflow-hidden pt-44 md:pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(232,168,124,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block text-[var(--accent-blue)] text-xs font-bold tracking-widest uppercase mb-4">
            {t('label')}
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
            {t('titleLine1')}<br />
            <span className="text-gradient">{t('titleLine2')}</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </div>
      </section>

      <section className="bg-gradient-dark py-20 px-4">
        <div className="container-marketing">
          <div className="text-center mb-10">
            <p className="font-mono text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--accent-blue)' }}>
              {t('whatsappLabel')}
            </p>
            <h2 className="section-title-distorted text-white text-center mb-3" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
              {t('whatsappTitle')}
            </h2>
            <p className="font-mono text-sm mx-auto" style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
              {t('whatsappSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GROUPS.map((group) => (
              <a
                key={group.titleKey}
                href={group.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md p-6 no-underline transition-colors duration-200 border hover:border-[var(--accent-blue)]"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <span className="text-[28px]">{group.icon}</span>
                <h3 className="font-mono font-bold text-white mt-3 mb-2" style={{ fontSize: '16px' }}>
                  {t(group.titleKey)}
                </h3>
                <p className="font-mono leading-relaxed mb-4" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {t(group.descKey)}
                </p>
                <span className="font-mono font-bold uppercase" style={{ color: 'var(--accent-blue)', fontSize: '12px' }}>
                  {t('joinGroup')} →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
