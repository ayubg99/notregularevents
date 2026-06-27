'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { EventRow } from '@/types/database'
import { EventsSectionHeader } from '@/components/events/EventsSectionHeader'
import { EventsCarousel } from '@/components/events/EventsCarousel'

// ─── City tabs ──────────────────────────────────────────────────

const CITIES = ['All', 'Madrid', 'Marbella', 'Valencia'] as const
type CityFilter = typeof CITIES[number]

// ─── Data fetching ──────────────────────────────────────────────

async function fetchEvents(): Promise<EventRow[]> {
  const res = await fetch('/api/events', { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json() as Promise<EventRow[]>
}

// ─── Skeleton ───────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: '16px', overflowX: 'hidden' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="event-poster-card animate-pulse"
          style={{ flexShrink: 0 }}
        >
          <div className="poster-image bg-white/5" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-8 w-1/4 rounded bg-white/5" />
            <div className="h-5 w-3/4 rounded bg-white/5" />
            <div className="h-4 w-1/2 rounded bg-white/5" />
            <div className="h-10 rounded bg-white/5 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────

export default function EventsClient() {
  const [activeCity, setActiveCity] = useState<CityFilter>('All')

  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn:  fetchEvents,
    staleTime: 60_000,
  })

  // Derive which city tabs actually have data
  const availableCities = useMemo(() => {
    const inData = new Set(events.map(e => e.city).filter(Boolean))
    return CITIES.filter(c => c === 'All' || inData.has(c))
  }, [events])

  const filtered = useMemo(() => {
    if (activeCity === 'All') return events
    return events.filter(e => e.city === activeCity)
  }, [events, activeCity])

  function clearFilters() {
    setActiveCity('All')
  }

  function handleCityChange(city: string) {
    setActiveCity(activeCity === city ? 'All' : city as CityFilter)
  }

  const hasFilters = activeCity !== 'All'

  const cityTabs = availableCities.filter(c => c !== 'All')

  return (
    <div>
      <EventsSectionHeader
        title="Upcoming Events"
        tag="Madrid // 2026"
        showTabs={cityTabs.length > 0}
        cities={cityTabs}
        activeCity={activeCity === 'All' ? undefined : activeCity}
        onCityChange={handleCityChange}
      />

      <div className="container-marketing" style={{ paddingBottom: '48px' }}>

        {/* Grid */}
        {isLoading ? (
          <Skeleton />
        ) : isError ? (
          <div className="text-center py-20 rounded-2xl glass-card">
            <p className="text-[var(--text-base)] text-lg font-medium">Failed to load events</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">Please refresh the page and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl glass-card">
            <p className="text-[var(--text-base)] text-lg font-medium">No events found</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">
              {hasFilters
                ? 'No events match your current filters.'
                : 'Check back soon — events are being planned!'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-5 py-2 btn-primary text-sm font-semibold transition-all"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <EventsCarousel events={filtered} />
        )}
      </div>
    </div>
  )
}
