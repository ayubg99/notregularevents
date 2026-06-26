import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title:       'Erasmus Life Valencia | Events, Housing & Community for Internationals',
  description: 'Your international community in Valencia, Spain. Events, housing and connections for expats, students, digital nomads and young professionals.',
  openGraph: {
    title:       'Erasmus Life Valencia | Events, Housing & Community',
    description: 'Your international community in Valencia, Spain. Events, housing and connections for expats, students and professionals.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Erasmus Life Valencia',
    description: 'Your international community in Valencia — events, housing and connections for expats and students.',
  },
}
import HeroSection from '@/components/home/HeroSection'
import FeaturedEvents from '@/components/home/FeaturedEvents'
import PartyRecapSection from '@/components/home/PartyRecapSection'
import CommunitySection from '@/components/home/CommunitySection'
import StatsSection from '@/components/home/StatsSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import NewsletterSection from '@/components/home/NewsletterSection'
import SponsorsSection from '@/components/home/SponsorsSection'
import AmbassadorSection from '@/components/home/AmbassadorSection'

// ─── Skeleton fallbacks shown while Supabase data loads ────────

function EventsSkeleton() {
  return (
    <section className="py-20 bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-48 rounded-lg bg-[var(--bg-subtle)] animate-pulse mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden glass-card">
              <div className="h-48 bg-[var(--bg-subtle)] animate-pulse" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-3/4 rounded bg-[var(--bg-subtle)] animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-[var(--bg-subtle)] animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-[var(--bg-subtle)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* 1. Hero — full viewport, video bg */}
      <HeroSection />

      {/* 2. Stats — count-up on scroll */}
      <StatsSection />

      {/* 3. Events — streams from Supabase */}
      <Suspense fallback={<EventsSkeleton />}>
        <FeaturedEvents />
      </Suspense>

      {/* 4. Party recap — horizontal video strip */}
      <Suspense fallback={null}>
        <PartyRecapSection />
      </Suspense>

      {/* 5. Ambassador program — earn by sharing */}
      <AmbassadorSection />

      {/* 6. Testimonials — auto-advance carousel */}
      <TestimonialsSection />

      {/* 7. Community — WhatsApp + Instagram CTAs */}
      <CommunitySection />

      {/* 8. Sponsors — logo strip, renders nothing if no active sponsors */}
      <SponsorsSection />

      {/* 9. Newsletter — server action + animated success */}
      <NewsletterSection />
    </>
  )
}
