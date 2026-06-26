import Link from 'next/link'
import { getPublicClient } from '@/lib/supabase/public'
import type { EventRow } from '@/types/database'
import EventCard from '@/components/events/EventCard'
import { EventsSectionHeader } from '@/components/events/EventsSectionHeader'

async function getPublishedEvents(): Promise<EventRow[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(4)

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

      {events.length === 0 ? (
        <div className="container-marketing" style={{ paddingBottom: '40px' }}>
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
        </div>
      ) : (
        <>
          <div
            className="container-marketing grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: '16px' }}
          >
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="container-marketing" style={{ marginTop: '24px', paddingBottom: '40px' }}>
            <Link
              href="/events"
              style={{
                display:        'inline-block',
                background:     'var(--accent-blue)',
                color:          '#fff',
                padding:        '12px 24px',
                fontFamily:     "'JetBrains Mono', monospace",
                fontWeight:     700,
                fontSize:       '13px',
                textTransform:  'uppercase',
                textDecoration: 'none',
                borderRadius:   '4px',
              }}
            >
              See More Events →
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
