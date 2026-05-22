import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://erasmusvibe.com'
  const routes = [
    { path: '',             freq: 'daily'  as const, priority: 1   },
    { path: '/events',      freq: 'daily'  as const, priority: 0.9 },
    { path: '/trips',       freq: 'daily'  as const, priority: 0.9 },
    { path: '/community',   freq: 'weekly' as const, priority: 0.8 },
    { path: '/membership',  freq: 'weekly' as const, priority: 0.8 },
    { path: '/about',       freq: 'monthly' as const, priority: 0.7 },
    { path: '/contact',     freq: 'monthly' as const, priority: 0.6 },
    { path: '/ambassadors', freq: 'monthly' as const, priority: 0.6 },
  ]

  return routes.map(({ path, freq, priority }) => ({
    url:             `${base}${path}`,
    lastModified:    new Date(),
    changeFrequency: freq,
    priority,
  }))
}
