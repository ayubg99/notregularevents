'use client'

import { useState, useMemo } from 'react'
import type { EventRow } from '@/types/database'
import { EventsSectionHeader } from '@/components/events/EventsSectionHeader'
import { EventsCarousel } from '@/components/events/EventsCarousel'

const CITIES = ['All', 'Madrid', 'Marbella', 'Valencia'] as const
type CityFilter = typeof CITIES[number]

export default function FeaturedEventsClient({ events }: { events: EventRow[] }) {
  const [activeCity, setActiveCity] = useState<CityFilter>('All')

  const availableCities = useMemo(() => {
    const inData = new Set(events.map(e => e.city).filter(Boolean))
    return CITIES.filter(c => c !== 'All' && inData.has(c))
  }, [events])

  const filtered = useMemo(() => {
    if (activeCity === 'All') return events
    return events.filter(e => e.city === activeCity)
  }, [events, activeCity])

  function handleCityChange(city: string) {
    setActiveCity(activeCity === city ? 'All' : city as CityFilter)
  }

  return (
    <section style={{ background: 'var(--bg-base)' }}>
      <EventsSectionHeader
        title="Upcoming Events"
        tag="Madrid // 2026"
        showTabs={availableCities.length > 0}
        cities={availableCities}
        activeCity={activeCity === 'All' ? undefined : activeCity}
        onCityChange={handleCityChange}
      />

      <div className="container-marketing" style={{ paddingBottom: '48px' }}>
        {filtered.length === 0 ? (
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
          <EventsCarousel events={filtered} />
        )}
      </div>
    </section>
  )
}
