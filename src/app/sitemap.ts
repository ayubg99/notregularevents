import type { MetadataRoute } from 'next'
import { getAdminClient } from '@/lib/supabase/admin'
import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = getAdminClient()
  const base  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://notregularevents.com'

  const staticPaths = [
    { path: '',             freq: 'daily'   as const, priority: 1   },
    { path: '/events',      freq: 'daily'   as const, priority: 0.9 },
    { path: '/housing',     freq: 'daily'   as const, priority: 0.9 },
    { path: '/community',   freq: 'weekly'  as const, priority: 0.8 },
    { path: '/membership',  freq: 'weekly'  as const, priority: 0.8 },
    { path: '/about',       freq: 'monthly' as const, priority: 0.7 },
    { path: '/contact',     freq: 'monthly' as const, priority: 0.6 },
    { path: '/ambassadors', freq: 'monthly' as const, priority: 0.6 },
  ]

  const staticPages: MetadataRoute.Sitemap = locales.flatMap(locale =>
    staticPaths.map(({ path, freq, priority }) => ({
      url:             `${base}/${locale}${path}`,
      lastModified:    new Date(),
      changeFrequency: freq,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${base}/${l}${path}`])
        ),
      },
    }))
  )

  const { data: events } = await admin
    .from('events')
    .select('slug, updated_at')
    .eq('status', 'published')

  const eventPages: MetadataRoute.Sitemap = locales.flatMap(locale =>
    (events ?? []).map(event => ({
      url:             `${base}/${locale}/events/${event.slug}`,
      lastModified:    new Date(event.updated_at),
      changeFrequency: 'weekly' as const,
      priority:        0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${base}/${l}/events/${event.slug}`])
        ),
      },
    }))
  )

  return [...staticPages, ...eventPages]
}
