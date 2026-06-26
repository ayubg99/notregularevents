import type { MetadataRoute } from 'next'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = getAdminClient()
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://notregularevents.com'

  const staticRoutes: { path: string; freq: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '',             freq: 'daily',   priority: 1   },
    { path: '/events',      freq: 'daily',   priority: 0.9 },
    { path: '/housing',     freq: 'daily',   priority: 0.9 },
    { path: '/community',   freq: 'weekly',  priority: 0.8 },
    { path: '/membership',  freq: 'weekly',  priority: 0.8 },
    { path: '/about',       freq: 'monthly', priority: 0.7 },
    { path: '/contact',     freq: 'monthly', priority: 0.6 },
    { path: '/ambassadors', freq: 'monthly', priority: 0.6 },
  ]

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map(({ path, freq, priority }) => ({
    url:             `${base}${path}`,
    lastModified:    new Date(),
    changeFrequency: freq,
    priority,
  }))

  const { data: events } = await admin
    .from('events')
    .select('slug, updated_at')
    .eq('status', 'published')

  const eventPages: MetadataRoute.Sitemap = (events ?? []).map(event => ({
    url:             `${base}/events/${event.slug}`,
    lastModified:    new Date(event.updated_at),
    changeFrequency: 'weekly',
    priority:        0.7,
  }))

  return [...staticPages, ...eventPages]
}
