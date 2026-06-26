import Link from 'next/link'
import Image from 'next/image'
import type { EventRow, EventCategory } from '@/types/database'
import { cn } from '@/lib/utils/cn'

// Full static strings — Tailwind v4 content scan requires no interpolation
const GRADIENTS: Record<EventCategory, string> = {
  party:                'from-orange-500 to-red-400',
  cultural:             'from-teal-500 to-cyan-400',
  sport:                'from-green-500 to-emerald-400',
  networking:           'from-blue-500 to-indigo-400',
  trip:                 'from-purple-500 to-violet-400',
  other:                'from-slate-500 to-slate-400',
  language_exchange:    'from-yellow-500 to-amber-400',
  food_wine:            'from-rose-500 to-orange-400',
  hiking:               'from-green-500 to-lime-400',
  yoga:                 'from-purple-400 to-pink-400',
  art:                  'from-fuchsia-500 to-violet-400',
  international_dinner: 'from-teal-500 to-cyan-400',
  club_night:           'from-blue-600 to-violet-600',
  football_screening:   'from-green-600 to-emerald-500',
  artist_night:         'from-orange-500 to-pink-500',
}

const BADGE_COLORS: Record<EventCategory, string> = {
  party:                'bg-orange-500/20  text-orange-400  border-orange-500/30',
  cultural:             'bg-teal-400/20    text-teal-300    border-teal-400/30',
  sport:                'bg-green-500/20   text-green-400   border-green-500/30',
  networking:           'bg-blue-500/20    text-blue-400    border-blue-500/30',
  trip:                 'bg-purple-500/20  text-purple-400  border-purple-500/30',
  other:                'bg-slate-500/20   text-slate-400   border-slate-500/30',
  language_exchange:    'bg-yellow-500/20  text-yellow-300  border-yellow-500/30',
  food_wine:            'bg-rose-500/20    text-rose-300    border-rose-500/30',
  hiking:               'bg-lime-500/20    text-lime-300    border-lime-500/30',
  yoga:                 'bg-pink-500/20    text-pink-300    border-pink-500/30',
  art:                  'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  international_dinner: 'bg-teal-500/20    text-teal-300    border-teal-500/30',
  club_night:           'bg-blue-500/20    text-blue-300    border-blue-500/30',
  football_screening:   'bg-green-600/20   text-green-400   border-green-600/30',
  artist_night:         'bg-orange-500/20  text-orange-300  border-orange-500/30',
}

const LABELS: Record<EventCategory, string> = {
  party:                'Party Night',
  cultural:             'Cultural',
  sport:                'Sport',
  networking:           'Networking',
  trip:                 'Trip',
  other:                'Other',
  language_exchange:    'Language Exchange',
  food_wine:            'Food & Wine',
  hiking:               'Hiking',
  yoga:                 'Yoga & Wellness',
  art:                  'Art & Culture',
  international_dinner: 'International Dinner',
  club_night:           'Club Night',
  football_screening:   'Football',
  artist_night:         'Artist Night',
}

interface Props {
  event:      EventRow
  className?: string
}

export default function EventCard({ event, className }: Props) {
  const spotsLeft = event.capacity - event.tickets_sold
  const isSoldOut = spotsLeft <= 0
  const now = new Date()
  const earlyBirdActive =
    !!event.price_early_bird &&
    event.price_early_bird > 0 &&
    !!event.early_bird_deadline &&
    new Date(event.early_bird_deadline) > now
  const displayPrice = earlyBirdActive ? event.price_early_bird! : event.price
  const isFree       = event.is_free || displayPrice === 0

  const eventDate     = new Date(event.date)
  const dayNumber     = eventDate.getDate()
  const monthYear     = eventDate.toLocaleDateString('en', { month: 'short', year: 'numeric' })
  const formattedPrice = isFree ? 'Free' : `€${displayPrice.toFixed(2)}`

  const hasVipTier = (event.ticket_tiers ?? []).some(t => /vip|table/i.test(t.name))

  return (
    <div
      className={cn('flex flex-col overflow-hidden', className)}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Image / gradient fallback */}
      <Link href={`/events/${event.slug}`} className="relative block h-[280px] overflow-hidden flex-shrink-0 group">
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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Category badge */}
        <span className={cn(
          'absolute top-3 left-3 px-2.5 py-1 rounded-full border text-xs font-semibold glass backdrop-blur-md',
          BADGE_COLORS[event.category],
        )}>
          {LABELS[event.category]}
        </span>

        {/* Price / Early Bird / Members badge */}
        {event.members_only_free ? (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-bold" style={{ background: 'rgba(45,91,255,0.2)', color: '#2D5BFF', border: '1px solid rgba(45,91,255,0.4)' }}>
            👑 Members Free
          </span>
        ) : isFree ? (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-bold" style={{ background: 'rgba(46,204,113,0.2)', color: '#4CAF50', border: '1px solid rgba(46,204,113,0.4)' }}>
            🎉 FREE
          </span>
        ) : earlyBirdActive ? (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-bold" style={{ background: '#2D5BFF', color: '#FFFFFF' }}>
            🔥 Early Bird {formattedPrice}
          </span>
        ) : (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-bold" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            {formattedPrice}
          </span>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-widest uppercase">Sold Out</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Date badge */}
        <div className="flex items-baseline gap-2 mb-2.5">
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: '#2D5BFF', lineHeight: 1 }}>
            {dayNumber}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
            {monthYear}
          </span>
        </div>

        <h3 className="font-sans font-bold text-base text-white leading-snug mb-1.5">
          {event.title}
        </h3>

        {event.location && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 16px' }}>
            {event.location}
          </p>
        )}

        {/* Dual action CTAs */}
        <div className="flex flex-col gap-1.5 mt-auto pt-4">
          <Link
            href={`/events/${event.slug}`}
            className="block text-center text-white text-xs font-bold uppercase py-2.5 transition-colors hover:bg-white/5"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            {isSoldOut ? 'Sold Out' : 'Tickets Available'}
          </Link>

          {!isSoldOut && hasVipTier && (
            <Link
              href={`/events/${event.slug}#vip`}
              className="block text-center text-xs font-bold uppercase py-1.5 transition-colors hover:text-white"
              style={{ color: 'var(--text-muted)' }}
            >
              Reserve VIP Table →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
