import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CalendarRange, Users } from 'lucide-react'
import type { TripRow } from '@/types/database'
import { cn } from '@/lib/utils/cn'

// Full static strings — Tailwind v4 content scan requires uninterpolated class names
function getTripGradient(category: string | null): string {
  const map: Record<string, string> = {
    beach:     'from-cyan-500 to-blue-400',
    city:      'from-violet-600 to-indigo-500',
    mountain:  'from-green-600 to-emerald-500',
    cultural:  'from-amber-500 to-orange-400',
    adventure: 'from-red-500 to-orange-400',
    festival:  'from-pink-500 to-purple-500',
    ski:       'from-sky-400 to-blue-500',
  }
  return category && map[category] ? map[category] : 'from-orange-500 to-teal-400'
}

interface TripCardProps {
  trip:       TripRow
  className?: string
}

export default function TripCard({ trip, className }: TripCardProps) {
  const seatsLeft    = trip.capacity - trip.seats_sold
  const displayPrice = trip.price_early_bird ?? trip.price_standard
  const hasEarlyBird = !!trip.price_early_bird

  const startFmt = new Date(trip.start_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })
  const endFmt = new Date(trip.end_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const dateRange    = `${startFmt} – ${endFmt}`
  const gradientClass = getTripGradient(trip.category)

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className={cn(
        'group block rounded-2xl overflow-hidden glass-card',
        'hover:shadow-brand-md hover:-translate-y-1 transition-all duration-300',
        className,
      )}
    >
      {/* Image / gradient fallback */}
      <div className="relative h-52 overflow-hidden">
        {trip.image_url ? (
          <Image
            src={trip.image_url}
            alt={trip.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradientClass)} />
        )}

        {/* Destination badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
          <MapPin size={11} className="text-brand-accent flex-shrink-0" />
          <span className="text-white text-xs font-semibold">{trip.destination}</span>
        </div>

        {/* Fully booked overlay */}
        {seatsLeft <= 0 && (
          <div className="absolute inset-0 bg-brand-dark/70 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-widest uppercase">Fully Booked</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-heading text-lg font-semibold text-white line-clamp-2 group-hover:text-brand-primary transition-colors duration-200">
          {trip.title}
        </h3>

        <div className="mt-3 flex flex-col gap-1.5 text-white/60 text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarRange size={13} className="flex-shrink-0" />
            {dateRange}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} className="flex-shrink-0" />
            {seatsLeft <= 0 ? 'Fully booked' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-primary text-base">
              From €{displayPrice.toFixed(0)}
            </span>
            {hasEarlyBird && (
              <span className="text-xs text-brand-success font-semibold">Early bird!</span>
            )}
          </div>
          <span className="text-xs text-white/40 group-hover:text-brand-accent transition-colors duration-200">
            Book now →
          </span>
        </div>
      </div>
    </Link>
  )
}
