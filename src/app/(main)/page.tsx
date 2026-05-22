import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title:       'Erasmus Vibe Valencia | Events, Trips & Community for Erasmus Students',
  description: 'The ultimate Erasmus student community in Valencia, Spain. Discover events, trips, memberships and unforgettable experiences.',
  openGraph: {
    title:       'Erasmus Vibe Valencia | Events, Trips & Community',
    description: 'The ultimate Erasmus student community in Valencia, Spain.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Erasmus Vibe Valencia',
    description: 'The ultimate Erasmus student community in Valencia, Spain.',
  },
}
import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'
import FeaturedEvents from '@/components/home/FeaturedEvents'
import FeaturedTrips from '@/components/home/FeaturedTrips'
import CommunitySection from '@/components/home/CommunitySection'

const StatsSection       = dynamic(() => import('@/components/home/StatsSection'),       { ssr: false })
const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), { ssr: false })
const NewsletterSection  = dynamic(() => import('@/components/home/NewsletterSection'),  { ssr: false })

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

function TripsSkeleton() {
  return (
    <section className="py-20 bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-40 rounded-lg bg-white/10 animate-pulse mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden glass-card">
              <div className="h-52 bg-white/10 animate-pulse" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
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

      {/* 4. Trips — streams from Supabase */}
      <Suspense fallback={<TripsSkeleton />}>
        <FeaturedTrips />
      </Suspense>

      {/* 5. Testimonials — auto-advance carousel */}
      <TestimonialsSection />

      {/* 6. Community — WhatsApp + Instagram CTAs */}
      <CommunitySection />

      {/* 7. Newsletter — server action + animated success */}
      <NewsletterSection />
    </>
  )
}
