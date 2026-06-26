import type { Metadata } from 'next'
import EventsClient from '@/components/events/EventsClient'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title:       'Events | Erasmus Life Valencia',
  description: 'Browse and book events for internationals in Valencia. Parties, networking, language exchange, food tours, hiking, yoga and more.',
  openGraph: {
    title:       'Events | Erasmus Life Valencia',
    description: 'Browse and book events for internationals in Valencia — parties, networking, cultural nights and more.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Events | Erasmus Life Valencia',
    description: 'Browse and book events for internationals in Valencia — parties, networking, cultural nights and more.',
  },
}

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-brand-dark pt-20 pb-24">
      <PageHeader tag="Valencia // 2026" title="Upcoming Events" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <EventsClient />
      </div>
    </main>
  )
}
