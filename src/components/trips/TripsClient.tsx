'use client'

import { useMemo, useState } from'react'
import { useQuery } from'@tanstack/react-query'
import { Search } from'lucide-react'
import type { TripRow } from'@/types/database'
import TripCard from'@/components/trips/TripCard'

const CATEGORIES = [
  { value:'all', label:'All Trips' },
  { value:'beach', label:'Beach' },
  { value:'city', label:'City Break' },
  { value:'adventure', label:'Adventure' },
  { value:'festival', label:'Festival' },
  { value:'cultural', label:'Cultural' },
  { value:'mountain', label:'Mountain' },
  { value:'ski', label:'Ski' },
]

const DURATION_OPTIONS = [
  { value:'all', label:'Any Duration' },
  { value:'weekend', label:'Weekend (1–3d)' },
  { value:'week', label:'Week (4–7d)' },
  { value:'extended', label:'Extended (8d+)' },
]

function getDurationBucket(start: string, end: string):'weekend' |'week' |'extended' {
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
  )
  if (days <= 3) return'weekend'
  if (days <= 7) return'week'
  return'extended'
}

function TripsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
          <div className="h-52 bg-white/5" />
          <div className="p-5 flex flex-col gap-3">
            <div className="h-5 w-3/4 bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
            <div className="h-2 w-full bg-white/5 rounded-full" />
            <div className="flex justify-between">
              <div className="h-5 w-16 bg-white/10 rounded" />
              <div className="h-8 w-24 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TripsClient() {
  const [category, setCategory] = useState('all')
  const [destination, setDestination] = useState('all')
  const [duration, setDuration] = useState('all')
  const [search, setSearch] = useState('')

  const { data: trips = [], isLoading, isError } = useQuery<TripRow[]>({
    queryKey: ['trips'],
    queryFn: () => fetch('/api/trips').then(r => r.json()),
    staleTime: 60_000,
  })

  const destinations = useMemo(() => {
    const unique = [...new Set(trips.map(t => t.destination))].sort()
    return unique
  }, [trips])

  const filtered = useMemo(() => {
    return trips.filter(trip => {
      if (category !=='all' && trip.category !== category) return false
      if (destination !=='all' && trip.destination !== destination) return false
      if (duration !=='all' && getDurationBucket(trip.start_date, trip.end_date) !== duration) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !trip.title.toLowerCase().includes(q) &&
          !trip.destination.toLowerCase().includes(q) &&
          !(trip.description ??'').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [trips, category, destination, duration, search])

  return (
    <div className="flex flex-col gap-8">
      {/* Filter bar */}
      <div className="flex flex-col gap-4">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === value
                  ?'bg-brand-primary text-brand-dark'
                  :'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search trips…"
              className="
                w-full pl-9 pr-4 py-2 rounded-xl text-sm
                border border-white/10 bg-white/5
                text-white placeholder:text-white/30
                focus:outline-none focus:border-brand-primary/50
                transition-colors
"
            />
          </div>

          <select
            value={destination}
            onChange={e => setDestination(e.target.value)}
            className="
              px-3 py-2 rounded-xl text-sm
              border border-white/10 bg-white/5
              text-white/70
              focus:outline-none focus:border-brand-primary/50
              transition-colors
"
          >
            <option value="all">All Destinations</option>
            {destinations.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="
              px-3 py-2 rounded-xl text-sm
              border border-white/10 bg-white/5
              text-white/70
              focus:outline-none focus:border-brand-primary/50
              transition-colors
"
          >
            {DURATION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <TripsSkeleton />
      ) : isError ? (
        <p className="text-red-400 text-sm">Failed to load trips. Please try again.</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-lg">No trips found matching your filters.</p>
          <button
            onClick={() => { setCategory('all'); setDestination('all'); setDuration('all'); setSearch('') }}
            className="mt-4 text-brand-primary text-sm hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
