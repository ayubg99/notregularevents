import Link from'next/link'
import { ArrowRight } from'lucide-react'
import { getPublicClient } from'@/lib/supabase/public'
import type { EventRow } from'@/types/database'
import EventCard from'./EventCard'

async function getPublishedEvents(): Promise<EventRow[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status','published')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(6)

    if (error) {
      console.error('[FeaturedEvents]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    // Catches missing env vars, network errors, or cookie context issues
    console.error('[FeaturedEvents] unexpected:', err)
    return []
  }
}

export default async function FeaturedEvents() {
  const events = await getPublishedEvents()

  return (
    <section className="py-20 bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-2">
              This Week in Valencia 
            </p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-[var(--text-base)]">
              Upcoming Events
            </h2>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-2 text-brand-primary font-medium text-sm hover:gap-3 transition-all duration-200"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {/* Cards or empty state */}
        {events.length === 0 ? (
          <EmptyState
            title="No upcoming events yet"
            message="Something exciting is always in the works — check back soon."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Mobile view-all */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/events" className="inline-flex items-center gap-2 text-brand-primary font-medium text-sm">
            View all events <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </section>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center py-16 rounded-2xl border border-[var(--border-clr)] bg-[var(--bg-card)]">
      <p className="text-[var(--text-base)] text-lg font-medium">{title}</p>
      <p className="text-[var(--text-muted)] text-sm mt-2">{message}</p>
    </div>
  )
}
