import Link from'next/link'
import Image from'next/image'
import { Calendar, MapPin, Users } from'lucide-react'
import type { EventRow, EventCategory } from'@/types/database'
import { cn } from'@/lib/utils/cn'

// Full static strings — Tailwind v4 content scan requires no interpolation
const GRADIENTS: Record<EventCategory, string> = {
  party:'from-orange-500 to-red-400',
  cultural:'from-teal-500 to-cyan-400',
  sport:'from-green-500 to-emerald-400',
  networking:'from-blue-500 to-indigo-400',
  trip:'from-purple-500 to-violet-400',
  other:'from-slate-500 to-slate-400',
  language_exchange:'from-yellow-500 to-amber-400',
  food_wine:'from-rose-500 to-orange-400',
  hiking:'from-green-500 to-lime-400',
  yoga:'from-purple-400 to-pink-400',
  art:'from-fuchsia-500 to-violet-400',
  international_dinner:'from-teal-500 to-cyan-400',
}

const BADGE_COLORS: Record<EventCategory, string> = {
  party:'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cultural:'bg-teal-400/20 text-teal-300 border-teal-400/30',
  sport:'bg-green-500/20 text-green-400 border-green-500/30',
  networking:'bg-blue-500/20 text-blue-400 border-blue-500/30',
  trip:'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other:'bg-slate-500/20 text-slate-400 border-slate-500/30',
  language_exchange:'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  food_wine:'bg-rose-500/20 text-rose-300 border-rose-500/30',
  hiking:'bg-lime-500/20 text-lime-300 border-lime-500/30',
  yoga:'bg-pink-500/20 text-pink-300 border-pink-500/30',
  art:'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  international_dinner:'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

const LABELS: Record<EventCategory, string> = {
  party:'Party Night',
  cultural:'Cultural',
  sport:'Sport',
  networking:'Networking',
  trip:'Trip',
  other:'Other',
  language_exchange:'Language Exchange',
  food_wine:'Food & Wine',
  hiking:'Hiking',
  yoga:'Yoga & Wellness',
  art:'Art & Culture',
  international_dinner:'International Dinner',
}

interface Props {
  event: EventRow
  className?: string
}

export default function EventCard({ event, className }: Props) {
  const spotsLeft = event.capacity - event.tickets_sold
  const isSoldOut = spotsLeft <= 0
  const fillPct = Math.round((event.tickets_sold / event.capacity) * 100)
  const isAlmostGone = !isSoldOut && spotsLeft <= Math.max(1, Math.ceil(event.capacity * 0.1))
  const now = new Date()
  const earlyBirdActive =
    !!event.price_early_bird &&
    event.price_early_bird > 0 &&
    !!event.early_bird_deadline &&
    new Date(event.early_bird_deadline) > now
  const displayPrice = earlyBirdActive ? event.price_early_bird! : event.price
  const isFree = event.is_free || displayPrice === 0

  const formattedDate = new Date(event.date).toLocaleDateString('en-GB', {
    weekday:'short', day:'numeric', month:'short',
  })
  const formattedPrice = isFree ?'Free' :`€${displayPrice.toFixed(2)}`

  return (
    <div className={cn('group rounded-3xl overflow-hidden glass-card card-hover flex flex-col border border-white/8 hover:border-brand-primary/25', className)}>
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

        {/* Gradient overlay — deepens on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-black/35 transition-all duration-300" />

        {/* Category badge */}
        <span className={cn(
'absolute top-3 left-3 px-2.5 py-1 rounded-full border text-xs font-semibold glass backdrop-blur-md',
          BADGE_COLORS[event.category],
        )}>
          {LABELS[event.category]}
        </span>

        {/* Price / Early Bird badge */}
        {event.members_only_free ? (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'rgba(255,107,0,0.2)', color:'#FF6B00', border:'1px solid rgba(255,107,0,0.4)' }}>
             Members Free
          </span>
        ) : isFree ? (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'rgba(46,204,113,0.2)', color:'#2ECC71', border:'1px solid rgba(46,204,113,0.4)' }}>
             FREE
          </span>
        ) : earlyBirdActive ? (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background:'#FF6B00', color:'#0D0D0D' }}>
             Early Bird {formattedPrice}
          </span>
        ) : (
          <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-xs font-bold">
            {formattedPrice}
          </span>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-brand-dark/75 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-widest uppercase">Sold Out</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-lg font-semibold text-white line-clamp-2 group-hover:text-brand-primary transition-colors duration-200">
          {event.title}
        </h3>

        <div className="mt-3 flex flex-col gap-1.5 text-white/55 text-sm">
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
              ?'Sold out'
              : isAlmostGone
              ?`Only ${spotsLeft} spot${spotsLeft === 1 ?'' :'s'} left!`
              :`${spotsLeft} spot${spotsLeft === 1 ?'' :'s'} remaining`}
          </span>
        </div>

        {/* Capacity progress bar */}
        {!isSoldOut && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
'h-full rounded-full transition-all duration-700',
                  isAlmostGone ?'bg-red-500' : fillPct > 60 ?'bg-orange-400' :'bg-brand-success',
                )}
                style={{ width:`${fillPct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-white/40">{fillPct}% filled</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4">
          <Link
            href={`/events/${event.slug}`}
            className={cn(
'block w-full text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-200',
              isSoldOut
                ?'bg-white/10 text-white/40 pointer-events-none'
                :'btn-primary',
            )}
          >
            {isSoldOut ?'Sold Out' : event.members_only_free ?'Members Only' : isFree ?'Register Free' :'Book Now'}
          </Link>
        </div>
      </div>
    </div>
  )
}
