import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPublicClient } from '@/lib/supabase/public'
import { Hero } from '@/components/home/Hero'
import FeaturedEvents from '@/components/home/FeaturedEvents'
import PartyRecapSection from '@/components/home/PartyRecapSection'
import CommunitySection from '@/components/home/CommunitySection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import NewsletterSection from '@/components/home/NewsletterSection'
import SponsorsSection from '@/components/home/SponsorsSection'
import AmbassadorSection from '@/components/home/AmbassadorSection'
import { HousingBanner } from '@/components/home/HousingBanner'

export const metadata: Metadata = {
  title:       'Not Regular Events | Guestlist Parties & Club Nights in Madrid',
  description: 'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid. Join the community.',
  openGraph: {
    title:       'Not Regular Events | Guestlist Parties & Club Nights in Madrid',
    description: 'Not your regular events. Guestlist parties, club nights and the best nightlife experiences in Madrid.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Not Regular Events — Madrid',
    description: 'Not your regular events. Guestlist parties, club nights and the best nightlife in Madrid.',
  },
}

// ─── Skeleton fallbacks shown while Supabase data loads ────────

function EventsSkeleton() {
  return (
    <section className="py-20 bg-[var(--bg-base)]">
      <div className="container-marketing">
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

export default async function HomePage() {
  const supabase = getPublicClient()
  const { data: nextEvent } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (
    <>
      {/* 1. Hero — video background + live "Next Up" event block */}
      <Hero nextEvent={nextEvent} />

      {/* 2. Events — streams from Supabase */}
      <Suspense fallback={<EventsSkeleton />}>
        <FeaturedEvents />
      </Suspense>

      {/* 3. Party recap — horizontal video strip */}
      <Suspense fallback={null}>
        <PartyRecapSection />
      </Suspense>

      {/* 4. Ambassador program — earn by sharing */}
      <AmbassadorSection />

      {/* 5. Testimonials — auto-advance carousel */}
      <TestimonialsSection />

      {/* 6. Community — WhatsApp + Instagram CTAs */}
      <CommunitySection />

      {/* 7. Sponsors — logo strip, renders nothing if no active sponsors */}
      <SponsorsSection />

      {/* 8. Housing teaser — compact banner linking to /housing */}
      <HousingBanner />

      {/* 9. Newsletter — server action + animated success */}
      <NewsletterSection />
    </>
  )
}
