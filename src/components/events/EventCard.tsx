import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { EventRow, EventCategory } from '@/types/database'
import { cn } from '@/lib/utils/cn'

// Full static strings — Tailwind v4 content scan requires no interpolation
const GRADIENTS: Record<EventCategory, string> = {
  party:      'from-purple-600 to-pink-500',
  cultural:   'from-amber-500 to-orange-400',
  sport:      'from-green-600 to-teal-500',
  networking: 'from-blue-600 to-indigo-500',
  trip:       'from-orange-500 to-teal-400',
  other:      'from-slate-600 to-slate-500',
}

const BADGE_COLORS: Record<EventCategory, string> = {
  party:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cultural:   'bg-amber-500/20  text-amber-300  border-amber-500/30',
  sport:      'bg-green-500/20  text-green-300  border-green-500/30',
  networking: 'bg-blue-500/20   text-blue-300   border-blue-500/30',
  trip:       'bg-orange-500/20 text-orange-300 border-orange-500/30',
  other:      'bg-slate-500/20  text-slate-300  border-slate-500/30',
}

const LABELS: Record<EventCategory, string> = {
  party:      'Party Night',
  cultural:   'Cultural',
  sport:      'Sport',
  networking: 'Networking',
  trip:       'Trip',
  other:      'Other',
}

interface Props {
  event:      EventRow
  className?: string
}

export default function EventCard({ event, className }: Props) {
  const spotsLeft    = event.capacity - event.tickets_sold
  const isSoldOut    = spotsLeft <= 0
  const fillPct      = Math.round((event.tickets_sold / event.capacity) * 100)
  const isAlmostGone = !isSoldOut && spotsLeft <= Math.max(1, Math.ceil(event.capacity * 0.1))
  const isFree       = event.price === 0

  const formattedDate  = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const formattedPrice = isFree ? 'Free' : `€${event.price.toFixed(2)}`

  return (
    <div className={cn('group rounded-2xl overflow-hidden glass-card flex flex-col', className)}>
      {/* Image / gradient fallback */}
      <div className="relative h-52 overflow-hidden flex-shrink-0">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', GRADIENTS[event.category])} />
        )}

        {/* Category badge */}
        <span className={cn(
          'absolute top-3 left-3 px-2.5 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm',
          BADGE_COLORS[event.category],
        )}>
          {LABELS[event.category]}
        </span>

        {/* Price badge */}
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-brand-dark/80 backdrop-blur-sm text-white text-sm font-bold border border-white/10">
          {formattedPrice}
        </span>

        {isSoldOut && (
          <div className="absolute inset-0 bg-brand-dark/75 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-widest uppercase">Sold Out</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-lg font-semibold text-[var(--text-base)] line-clamp-2 group-hover:text-brand-primary transition-colors duration-200">
          {event.title}
        </h3>

        <div className="mt-3 flex flex-col gap-1.5 text-[var(--text-muted)] text-sm">
          <span className="flex items-center gap-2">
            <Calendar size={13} className="flex-shrink-0 text-brand-primary" />
            {formattedDate}
          </span>
          {event.location && (
            <span className="flex items-center gap-2">
              <MapPin size={13} className="flex-shrink-0 text-brand-accent" />
              <span className="line-clamp-1">{event.location}</span>
            </span>
          )}
          <span className="flex items-center gap-2">
            <Users size={13} className="flex-shrink-0" />
            {isSoldOut
              ? 'Sold out'
              : isAlmostGone
              ? `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left!`
              : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining`}
          </span>
        </div>

        {/* Capacity progress bar */}
        {!isSoldOut && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isAlmostGone ? 'bg-red-500' : fillPct > 60 ? 'bg-amber-400' : 'bg-brand-success',
                )}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">{fillPct}% filled</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4">
          <Link
            href={`/events/${event.slug}`}
            className={cn(
              'block w-full text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-200',
              isSoldOut
                ? 'bg-white/10 text-[var(--text-muted)] pointer-events-none'
                : 'bg-brand-primary hover:brightness-110 text-white shadow-brand-sm hover:shadow-brand-md active:brightness-90',
            )}
          >
            {isSoldOut ? 'Sold Out' : isFree ? 'RSVP Free' : 'Book Now'}
          </Link>
        </div>
      </div>
    </div>
  )
}
