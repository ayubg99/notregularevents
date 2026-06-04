import Image from'next/image'
import Link from'next/link'
import { Calendar, MapPin, Users } from'lucide-react'
import type { TripRow } from'@/types/database'

const CATEGORY_GRADIENTS: Record<string, string> = {
  beach:'from-cyan-500/40 to-blue-500/30',
  city:'from-violet-500/40 to-indigo-500/30',
  adventure:'from-emerald-500/40 to-teal-500/30',
  festival:'from-pink-500/40 to-rose-500/30',
  cultural:'from-amber-500/40 to-orange-500/30',
  mountain:'from-slate-500/40 to-gray-500/30',
  ski:'from-blue-400/40 to-cyan-400/30',
}

const CATEGORY_LABELS: Record<string, string> = {
  beach:'Beach',
  city:'City Break',
  adventure:'Adventure',
  festival:'Festival',
  cultural:'Cultural',
  mountain:'Mountain',
  ski:'Ski',
}

const BADGE_COLORS: Record<string, string> = {
  beach:'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  city:'bg-violet-500/20 text-violet-300 border-violet-500/30',
  adventure:'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  festival:'bg-pink-500/20 text-pink-300 border-pink-500/30',
  cultural:'bg-amber-500/20 text-amber-300 border-amber-500/30',
  mountain:'bg-slate-500/20 text-slate-300 border-slate-500/30',
  ski:'bg-blue-400/20 text-blue-300 border-blue-400/30',
}

function durationLabel(start: string, end: string): string {
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
  )
  if (days <= 3) return`${days}d Weekend`
  if (days <= 7) return`${days}d Trip`
  return`${days}d Extended`
}

interface Props {
  trip: TripRow
}

export default function TripCard({ trip }: Props) {
  const cat = trip.category ??'adventure'
  const gradient = CATEGORY_GRADIENTS[cat] ?? CATEGORY_GRADIENTS.adventure
  const badge = BADGE_COLORS[cat] ?? BADGE_COLORS.adventure
  const label = CATEGORY_LABELS[cat] ??'Trip'
  const seatsLeft = trip.capacity - trip.seats_sold
  const soldPct = (trip.seats_sold / trip.capacity) * 100

  const startDate = new Date(trip.start_date).toLocaleDateString('en-GB', {
    day:'numeric', month:'short',
  })
  const endDate = new Date(trip.end_date).toLocaleDateString('en-GB', {
    day:'numeric', month:'short', year:'numeric',
  })

  const now = new Date()
  const ebDeadlineValid = !!trip.price_early_bird &&
    trip.price_early_bird > 0 &&
    !!trip.early_bird_deadline &&
    new Date(trip.early_bird_deadline) > now
  const ebSeatsLeft = (trip.early_bird_seats ?? 0) - (trip.early_bird_seats_sold ?? 0)
  const earlyBirdActive = ebDeadlineValid && (trip.early_bird_seats == null || ebSeatsLeft > 0)
  const earlyBirdSoldOut = ebDeadlineValid && trip.early_bird_seats != null && ebSeatsLeft <= 0
  const displayPrice = earlyBirdActive ? trip.price_early_bird! : trip.price_standard

  return (
    <Link href={`/trips/${trip.slug}`} className="group block">
      <article className="glass-card card-hover rounded-3xl overflow-hidden border border-white/8 hover:border-brand-primary/25">

        {/* Image / gradient hero */}
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
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}
          {/* Gradient overlay — deepens on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent group-hover:from-black/92 group-hover:via-black/35 transition-all duration-300" />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-block px-2.5 py-1 rounded-full border text-xs font-semibold glass backdrop-blur-md ${badge}`}>
              {label}
            </span>
          </div>

          {/* Duration badge */}
          <div className="absolute top-3 right-3">
            <span className="inline-block px-2.5 py-1 rounded-full glass backdrop-blur-md text-white/80 text-xs border border-white/10">
              {durationLabel(trip.start_date, trip.end_date)}
            </span>
          </div>

          {/* Fully booked overlay */}
          {seatsLeft <= 0 && (
            <div className="absolute inset-0 bg-brand-dark/70 flex items-center justify-center">
              <span className="text-white font-bold text-lg tracking-widest uppercase">Sold Out</span>
            </div>
          )}

          {/* Destination overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/90 text-sm">
            <MapPin size={13} className="text-brand-accent flex-shrink-0" />
            <span className="font-medium">{trip.destination}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3">
          <h3 className="font-heading text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors">
            {trip.title}
          </h3>

          {/* Dates */}
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Calendar size={12} className="flex-shrink-0" />
            <span>{startDate} – {endDate}</span>
          </div>

          {/* Capacity bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
              <span className="flex items-center gap-1"><Users size={11} /> {seatsLeft} seats left</span>
              <span>{trip.seats_sold}/{trip.capacity}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  soldPct >= 90 ?'bg-red-500' : soldPct >= 60 ?'bg-orange-500' :'bg-brand-primary'
                }`}
                style={{ width:`${soldPct}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div>
              {earlyBirdActive && (
                <p className="text-xs text-brand-accent font-bold uppercase tracking-wide">Early Bird</p>
              )}
              {earlyBirdSoldOut && (
                <p className="text-xs text-red-400 font-bold uppercase tracking-wide"> Early Bird Sold Out</p>
              )}
              <p className={`font-bold text-base ${earlyBirdActive ?'text-gradient-primary' :'text-white'}`}>
                {displayPrice === 0 ?'Free' :`From €${displayPrice}`}
              </p>
            </div>
            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              seatsLeft === 0
                ?'bg-white/10 text-white/40 cursor-not-allowed'
                :'btn-primary px-5 py-2 text-sm'
            }`}>
              {seatsLeft === 0 ?'Sold Out' :'Book Trip'}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
