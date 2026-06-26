'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { EventRow, EventCategory } from '@/types/database'
import EventCard from '@/components/events/EventCard'
import { TabSelector } from '@/components/shared/TabSelector'
import { EventsSectionHeader } from '@/components/events/EventsSectionHeader'

// ─── City tabs ──────────────────────────────────────────────────

const CITIES = ['All', 'Madrid', 'Marbella', 'Valencia'] as const
type CityFilter = typeof CITIES[number]

// ─── Category tabs ──────────────────────────────────────────────

const CATEGORIES: { value: EventCategory | 'all'; label: string }[] = [
  { value: 'all',               label: 'All'         },
  { value: 'club_night',        label: 'Club Night'  },
  { value: 'football_screening',label: 'Football'    },
  { value: 'artist_night',      label: 'Artist Night'},
  { value: 'party',             label: 'Party'       },
  { value: 'cultural',          label: 'Cultural'    },
  { value: 'sport',             label: 'Sport'       },
  { value: 'networking',        label: 'Networking'  },
  { value: 'trip',              label: 'Trip'        },
  { value: 'other',             label: 'Other'       },
]

// ─── Data fetching ──────────────────────────────────────────────

async function fetchEvents(): Promise<EventRow[]> {
  const res = await fetch('/api/events', { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json() as Promise<EventRow[]>
}

// ─── Skeleton ───────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '16px' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="bg-white/5" style={{ height: '300px' }} />
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
  const [activeCity,     setActiveCity]     = useState<CityFilter>('All')
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all')
  const [search, setSearch]                 = useState('')

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
    let list = events
    if (activeCity !== 'All') {
      list = list.filter(e => e.city === activeCity)
    }
    if (activeCategory !== 'all') {
      list = list.filter(e => e.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.location ?? '').toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [events, activeCity, activeCategory, search])

  function clearFilters() {
    setSearch('')
    setActiveCategory('all')
    setActiveCity('All')
  }

  // Clicking the active city deselects it (back to All)
  function handleCityChange(city: string) {
    if (activeCity === city) {
      setActiveCity('All')
    } else {
      setActiveCity(city as CityFilter)
      setActiveCategory('all')
    }
  }

  const hasFilters = search.trim() !== '' || activeCategory !== 'all' || activeCity !== 'All'

  const cityTabs = availableCities.filter(c => c !== 'All')

  return (
    <div>
      {/* Section header — city tabs shown when events span multiple cities */}
      <EventsSectionHeader
        title="Upcoming Events"
        tag="Madrid // 2026"
        showTabs={cityTabs.length > 1}
        cities={cityTabs}
        activeCity={activeCity === 'All' ? undefined : activeCity}
        onCityChange={handleCityChange}
      />

      <div className="container-marketing" style={{ paddingBottom: '48px' }}>
        {/* Filter bar — search + category (city handled in header) */}
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events by name or location…"
                className="w-full pl-10 pr-4 py-3 rounded-full text-sm glass-card text-white placeholder:text-white/30 focus:outline-none focus:border-brand-primary/60 transition-all duration-200"
              />
            </div>
            {!isLoading && !isError && (
              <div className="flex items-center gap-1.5 text-white/45 text-sm self-center">
                <SlidersHorizontal size={14} />
                <span>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <TabSelector
            options={CATEGORIES.map(c => c.label)}
            active={CATEGORIES.find(c => c.value === activeCategory)?.label ?? 'All'}
            onChange={label => setActiveCategory(CATEGORIES.find(c => c.label === label)?.value ?? 'all')}
          />
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '16px' }}>
            {filtered.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
