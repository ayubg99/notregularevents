import type { Metadata } from 'next'
import EventsClient from '@/components/events/EventsClient'

export const metadata: Metadata = {
  title:       'Events | Erasmus Vibe Valencia',
  description: 'Browse and book events for internationals in Valencia. Parties, networking, language exchange, food tours, hiking, yoga and more.',
  openGraph: {
    title:       'Events | Erasmus Vibe Valencia',
    description: 'Browse and book events for internationals in Valencia — parties, networking, cultural nights and more.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Events | Erasmus Vibe Valencia',
    description: 'Browse and book events for internationals in Valencia — parties, networking, cultural nights and more.',
  },
}

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-2">
            What&apos;s On
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[var(--text-base)]">
            Upcoming Events
          </h1>
          <p className="mt-3 text-[var(--text-muted)] max-w-xl leading-relaxed">
            From beach parties to language exchanges — there&apos;s always something happening in Valencia for internationals.
          </p>
        </div>

        <EventsClient />
      </div>
    </main>
  )
}
