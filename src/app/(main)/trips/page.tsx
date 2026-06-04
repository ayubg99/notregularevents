import type { Metadata } from'next'
import TripsClient from'@/components/trips/TripsClient'
import { getPublishedTrips } from'@/lib/supabase/queries'

export const metadata: Metadata = {
  title:'Trips | Erasmus Life Valencia',
  description:'Explore Spain and beyond with Erasmus Life. Weekend getaways, cultural road trips, wine tours and international group travel — organised for Valencia\'s international community.',
  openGraph: {
    title:'Trips | Erasmus Life Valencia',
    description:'Weekend getaways, cultural road trips, wine tours and adventures — organised for Valencia\'s international community.',
    images: [{ url:'/og-default.png', width: 1200, height: 630 }],
    type:'website',
  },
  twitter: {
    card:'summary_large_image',
    title:'Trips | Erasmus Life Valencia',
    description:'Weekend getaways, cultural road trips and wine tours — organised for Valencia\'s international community.',
  },
}

export default async function TripsPage() {
  const trips = await getPublishedTrips({ limit: 3 })

  const tripCount = trips.length
  const destCount = new Set(trips.map(t => t.destination)).size
  const lowestPrice = trips.length
    ? Math.min(
        ...trips.flatMap(t =>
          [t.price_early_bird, t.price_standard, t.price_vip, t.price_group]
            .filter((p): p is number => p != null),
        ),
      )
    : null

  return (
    <main className="min-h-screen bg-brand-dark">

      {/* Hero banner */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Decorative orbs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,107,0,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-16 left-1/4 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-brand-accent/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto text-center">
          <p className="text-brand-accent text-sm font-semibold uppercase tracking-widest mb-4">
            Valencia Adventures
          </p>
          <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.9] mb-6">
            <span className="text-gradient">Explore Spain</span>
            <br />
            <span className="text-white">&amp; Beyond</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Weekend getaways, cultural road trips, wine tours and international group travel —
            all organised for Valencia&apos;s international community.
          </p>

          {/* Quick stats */}
          <div className="inline-flex items-center gap-6 flex-wrap justify-center">
            {tripCount > 0 && (
              <div className="glass-card rounded-2xl px-5 py-3 text-center">
                <p className="font-heading text-2xl font-bold text-brand-primary">{tripCount}+</p>
                <p className="text-white/50 text-xs uppercase tracking-wide">Upcoming Trips</p>
              </div>
            )}
            {destCount > 0 && (
              <div className="glass-card rounded-2xl px-5 py-3 text-center">
                <p className="font-heading text-2xl font-bold text-brand-accent">{destCount}</p>
                <p className="text-white/50 text-xs uppercase tracking-wide">Destinations</p>
              </div>
            )}
            {lowestPrice != null && (
              <div className="glass-card rounded-2xl px-5 py-3 text-center">
                <p className="font-heading text-2xl font-bold text-white">
                  {lowestPrice === 0 ?'Free' :`€${lowestPrice}`}
                </p>
                <p className="text-white/50 text-xs uppercase tracking-wide">From</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trip listing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <TripsClient />
      </section>

    </main>
  )
}
