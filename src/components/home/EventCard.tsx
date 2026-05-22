import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Ticket } from 'lucide-react'
import type { EventRow, EventCategory } from '@/types/database'
import { cn } from '@/lib/utils/cn'

// Full static strings required — Tailwind v4 content scan won't detect interpolated classes
const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  party:      'from-purple-600 to-pink-500',
  cultural:   'from-amber-500 to-orange-400',
  sport:      'from-green-600 to-teal-500',
  networking: 'from-blue-600 to-indigo-500',
  trip:       'from-orange-500 to-teal-400',
  other:      'from-slate-600 to-slate-500',
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  party:      'Party',
  cultural:   'Cultural',
  sport:      'Sport',
  networking: 'Networking',
  trip:       'Trip',
  other:      'Event',
}

interface EventCardProps {
  event:      EventRow
  className?: string
}

export default function EventCard({ event, className }: EventCardProps) {
  const spotsLeft  = event.capacity - event.tickets_sold
  const isSoldOut  = spotsLeft <= 0
  const gradient   = CATEGORY_GRADIENTS[event.category] ?? CATEGORY_GRADIENTS.other
  const categoryLabel = CATEGORY_LABELS[event.category] ?? 'Event'

  const formattedDate  = new Date(event.date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const formattedPrice = event.price === 0 ? 'Free' : `€${event.price.toFixed(2)}`

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        'group block rounded-2xl overflow-hidden glass-card',
        'hover:shadow-brand-md hover:-translate-y-1 transition-all duration-300',
        className,
      )}
    >
      {/* Image / gradient fallback */}
      <div className="relative h-48 overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
        )}

        {/* Category badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wide">
          {categoryLabel}
        </span>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-brand-dark/70 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-widest uppercase">Sold Out</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-heading text-lg font-semibold text-white line-clamp-2 group-hover:text-brand-primary transition-colors duration-200">
          {event.title}
        </h3>

        <div className="mt-3 flex flex-col gap-1.5 text-white/60 text-sm">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="flex-shrink-0" />
            {formattedDate}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="flex-shrink-0" />
              {event.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Ticket size={13} className="flex-shrink-0" />
            {isSoldOut ? 'Sold out' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-brand-primary text-base">{formattedPrice}</span>
          <span className="text-xs text-white/40 group-hover:text-brand-accent transition-colors duration-200">
            View details →
          </span>
        </div>
      </div>
    </Link>
  )
}
