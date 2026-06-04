import type { MetadataRoute } from'next'
import { getAdminClient } from'@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = getAdminClient()
  const base = process.env.NEXT_PUBLIC_SITE_URL ??'https://erasmuslifevalencia.com'

  const staticRoutes: { path: string; freq: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path:'', freq:'daily', priority: 1 },
    { path:'/events', freq:'daily', priority: 0.9 },
    { path:'/trips', freq:'daily', priority: 0.9 },
    { path:'/housing', freq:'daily', priority: 0.8 },
    { path:'/jobs', freq:'daily', priority: 0.8 },
    { path:'/community', freq:'weekly', priority: 0.8 },
    { path:'/membership', freq:'weekly', priority: 0.8 },
    { path:'/about', freq:'monthly', priority: 0.7 },
    { path:'/contact', freq:'monthly', priority: 0.6 },
    { path:'/ambassadors', freq:'monthly', priority: 0.6 },
  ]

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map(({ path, freq, priority }) => ({
    url:`${base}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }))

  const { data: jobs } = await admin
    .from('job_listings')
    .select('id, updated_at')
    .eq('status','active')
    .gt('expires_at', new Date().toISOString())

  const jobPages: MetadataRoute.Sitemap = (jobs ?? []).map(job => ({
    url:`${base}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at),
    changeFrequency:'weekly',
    priority: 0.6,
  }))

  const { data: events } = await admin
    .from('events')
    .select('slug, updated_at')
    .eq('status','published')

  const eventPages: MetadataRoute.Sitemap = (events ?? []).map(event => ({
    url:`${base}/events/${event.slug}`,
    lastModified: new Date(event.updated_at),
    changeFrequency:'weekly',
    priority: 0.7,
  }))

  const { data: trips } = await admin
    .from('trips')
    .select('slug, updated_at')
    .eq('status','published')

  const tripPages: MetadataRoute.Sitemap = (trips ?? []).map(trip => ({
    url:`${base}/trips/${trip.slug}`,
    lastModified: new Date(trip.updated_at),
    changeFrequency:'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...jobPages, ...eventPages, ...tripPages]
}
