import Link from'next/link'
import { ArrowRight } from'lucide-react'
import { getPublicClient } from'@/lib/supabase/public'
import type { TripRow } from'@/types/database'
import TripCard from'@/components/trips/TripCard'

async function getPublishedTrips(): Promise<TripRow[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('status','published')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(6)

    if (error) {
      console.error('[FeaturedTrips]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[FeaturedTrips] unexpected:', err)
    return []
  }
}

export default async function FeaturedTrips() {
  const trips = await getPublishedTrips()

  return (
    <section className="py-20 bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-accent font-semibold text-sm uppercase tracking-widest mb-2">
              Erasmus Trips 
            </p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">
              Weekend Adventures
            </h2>
          </div>
          <Link
            href="/trips"
            className="hidden sm:flex items-center gap-2 text-brand-accent font-medium text-sm hover:gap-3 transition-all duration-200"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {/* Cards or empty state */}
        {trips.length === 0 ? (
          <div className="text-center py-16 rounded-2xl glass-card">
            <p className="text-white text-lg font-medium">No upcoming trips yet</p>
            <p className="text-white/50 text-sm mt-2">Epic adventures are being planned — stay tuned.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        {/* Mobile view-all */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/trips" className="inline-flex items-center gap-2 text-brand-accent font-medium text-sm">
            View all trips <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </section>
  )
}
