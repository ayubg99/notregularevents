'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { EventRow, EventCategory } from '@/types/database'
import EventCard from '@/components/events/EventCard'
import { cn } from '@/lib/utils/cn'

// ─── Category tabs ──────────────────────────────────────────────

const CATEGORIES: { value: EventCategory | 'all'; label: string }[] = [
  { value: 'all',                  label: 'All Events'          },
  { value: 'party',                label: 'Party Night'         },
  { value: 'networking',           label: 'Networking'          },
  { value: 'language_exchange',    label: 'Language Exchange'   },
  { value: 'international_dinner', label: 'International Dinner'},
  { value: 'food_wine',            label: 'Food & Wine'         },
  { value: 'cultural',             label: 'Cultural'            },
  { value: 'art',                  label: 'Art & Culture'       },
  { value: 'hiking',               label: 'Hiking'              },
  { value: 'yoga',                 label: 'Yoga & Wellness'     },
  { value: 'sport',                label: 'Sport'               },
  { value: 'trip',                 label: 'Trip'                },
  { value: 'other',                label: 'Other'               },
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden glass-card animate-pulse">
          <div className="h-52 bg-white/5" />
          <div className="p-5 flex flex-col gap-3">
            <div className="h-5 w-3/4 rounded bg-white/5" />
            <div className="h-4 w-1/2 rounded bg-white/5" />
            <div className="h-4 w-2/3 rounded bg-white/5" />
            <div className="h-1.5 rounded-full bg-white/5 mt-1" />
            <div className="h-10 rounded-full bg-white/5 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────

export default function EventsClient() {
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all')
  const [search, setSearch]                 = useState('')

  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn:  fetchEvents,
    staleTime: 60_000,
  })

  const filtered = useMemo(() => {
    let list = events
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
  }, [events, activeCategory, search])

  function clearFilters() {
    setSearch('')
    setActiveCategory('all')
  }

  const hasFilters = search.trim() !== '' || activeCategory !== 'all'

  return (
    <div>
      {/* ── Search + filter bar ── */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
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

          {/* Result count */}
          {!isLoading && !isError && (
            <div className="flex items-center gap-1.5 text-white/45 text-sm self-center">
              <SlidersHorizontal size={14} />
              <span>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200',
                activeCategory === cat.value
                  ? 'btn-primary font-semibold'
                  : 'glass-card border border-white/10 text-white/55 hover:text-white hover:border-white/25 font-medium',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
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
              className="mt-4 px-5 py-2 rounded-full bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
