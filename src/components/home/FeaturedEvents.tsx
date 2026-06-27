import { getPublicClient } from '@/lib/supabase/public'
import type { EventRow } from '@/types/database'
import { EventsSectionHeader } from '@/components/events/EventsSectionHeader'
import { EventsCarousel } from '@/components/events/EventsCarousel'

async function getPublishedEvents(): Promise<EventRow[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(8)

    if (error) {
      console.error('[FeaturedEvents]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[FeaturedEvents] unexpected:', err)
    return []
  }
}

export default async function FeaturedEvents() {
  const events = await getPublishedEvents()

  return (
    <section style={{ background: 'var(--bg-base)' }}>
      <EventsSectionHeader title="Upcoming Events" tag="Madrid // 2026" />

      <div className="container-marketing" style={{ paddingBottom: '48px' }}>
        {events.length === 0 ? (
          <div style={{
            textAlign:    'center',
            padding:      '64px 0',
            border:       '1px solid var(--border-clr)',
            background:   'var(--bg-card)',
            borderRadius: '16px',
          }}>
            <p style={{ color: 'var(--text-base)', fontSize: '18px', fontWeight: 500, margin: 0 }}>
              No events live right now
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
              New dates dropping soon.
            </p>
          </div>
        ) : (
          <EventsCarousel events={events} />
        )}
      </div>
    </section>
  )
}
