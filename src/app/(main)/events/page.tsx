import type { Metadata } from 'next'
import EventsClient from '@/components/events/EventsClient'

export const metadata: Metadata = {
  title:       'Events | Erasmus Vibe Valencia',
  description: 'Browse and book unforgettable events for Erasmus students in Valencia. Parties, cultural nights, sports, networking and more.',
  openGraph: {
    title:       'Events | Erasmus Vibe Valencia',
    description: 'Browse and book unforgettable events for Erasmus students in Valencia.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Events | Erasmus Vibe Valencia',
    description: 'Browse and book unforgettable events for Erasmus students in Valencia.',
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
            From beach parties to cultural nights — there&apos;s always something happening in Valencia for Erasmus students.
          </p>
        </div>

        <EventsClient />
      </div>
    </main>
  )
}
