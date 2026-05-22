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
    <main className="min-h-screen bg-brand-dark pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative mb-10 pt-4">
          {/* Decorative orbs */}
          <div className="absolute -top-10 -left-20 w-72 h-72 rounded-full bg-brand-primary/10 blur-[80px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-brand-accent/8 blur-[60px] pointer-events-none" />
          <div className="relative">
            <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-2">
              What&apos;s On
            </p>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              Upcoming <span className="text-gradient">Events</span>
            </h1>
            <p className="mt-3 text-white/55 max-w-xl leading-relaxed">
              From beach parties to language exchanges — there&apos;s always something happening in Valencia for internationals.
            </p>
          </div>
        </div>

        <EventsClient />
      </div>
    </main>
  )
}
