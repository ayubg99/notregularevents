import type { Metadata } from 'next'
import EventsClient from '@/components/events/EventsClient'

export const metadata: Metadata = {
  title:       'Events | Not Regular Events Madrid',
  description: 'Browse and book events in Madrid. Guestlist parties, club nights, artist nights and the best nightlife experiences.',
  openGraph: {
    title:       'Events | Not Regular Events Madrid',
    description: 'Browse and book events in Madrid — guestlist parties, club nights, artist nights and more.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Events | Not Regular Events Madrid',
    description: 'Browse and book events in Madrid — guestlist parties, club nights, artist nights and more.',
  },
}

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-brand-dark pt-32 md:pt-20 pb-24">
      <EventsClient />
    </main>
  )
}
