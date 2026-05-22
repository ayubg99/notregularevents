import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Users, ArrowLeft, ExternalLink } from 'lucide-react'
import { getEventBySlug, getEventReviews } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import CountdownTimer from '@/components/events/CountdownTimer'
import TicketSelector from '@/components/events/TicketSelector'
import ReviewsSection from '@/components/events/ReviewsSection'
import ShareButtons from '@/components/events/ShareButtons'

// ─── Types ──────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> }

// ─── SEO ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) return { title: 'Event Not Found' }

  const description = event.description?.slice(0, 155) ?? `Join us for ${event.title} in Valencia`

  return {
    title:       `${event.title} | Erasmus Vibe Valencia`,
    description,
    openGraph: {
      title:       event.title,
      description,
      type:        'website',
      images:      event.image_url ? [{ url: event.image_url }] : [],
    },
  }
}

// ─── Category label map ─────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  party:      'Party Night',
  cultural:   'Cultural',
  sport:      'Sport',
  networking: 'Networking',
  trip:       'Trip',
  other:      'Event',
}

const CATEGORY_COLORS: Record<string, string> = {
  party:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cultural:   'bg-amber-500/20  text-amber-300  border-amber-500/30',
  sport:      'bg-green-500/20  text-green-300  border-green-500/30',
  networking: 'bg-blue-500/20   text-blue-300   border-blue-500/30',
  trip:       'bg-orange-500/20 text-orange-300 border-orange-500/30',
  other:      'bg-slate-500/20  text-slate-300  border-slate-500/30',
}

// ─── Page ───────────────────────────────────────────────────────

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params

  // Fetch event first (notFound() if missing), then parallel-fetch the rest
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  const [reviews, supabase] = await Promise.all([
    getEventReviews(event.id),
    createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()

  const isPast = new Date(event.date) < new Date()
  const spotsLeft = event.capacity - event.tickets_sold

  const longDate = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const time = new Date(event.date).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })

  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null

  const categoryLabel = CATEGORY_LABELS[event.category] ?? 'Event'
  const categoryColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other

  return (
    <main className="min-h-screen bg-brand-dark">
      {/* ── Hero image ── */}
      <div className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/40 to-brand-accent/30" />
        )}

        {/* Scrim — bottom fade into page bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent" />

        {/* Back link */}
        <div className="absolute top-0 left-0 right-0 pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              All events
            </Link>
          </div>
        </div>

        {/* Category + title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm mb-3 ${categoryColor}`}>
              {categoryLabel}
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* ── LEFT: details + description + reviews ── */}
          <div className="flex flex-col gap-10">

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-white/70 text-sm">
              <span className="flex items-center gap-2">
                <Calendar size={15} className="text-brand-primary flex-shrink-0" />
                {longDate} · {time}
              </span>
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-brand-accent flex-shrink-0" />
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-accent transition-colors flex items-center gap-1"
                    >
                      {event.location}
                      <ExternalLink size={11} />
                    </a>
                  ) : event.location}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Users size={15} className="flex-shrink-0" />
                {event.tickets_sold} {event.tickets_sold === 1 ? 'person' : 'people'} going
              </span>
            </div>

            {/* Countdown — only for upcoming events */}
            {!isPast && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Starts in</p>
                <CountdownTimer targetDate={event.date} />
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="font-heading text-xl font-bold text-white mb-4">About this event</h2>
                <div className="text-white/70 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {event.description}
                </div>
              </div>
            )}

            {/* Share (visible on mobile above reviews, on desktop moved inline) */}
            <div className="lg:hidden">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Share</p>
              <ShareButtons title={event.title} slug={event.slug} />
            </div>

            {/* Reviews */}
            <ReviewsSection
              targetId={event.id}
              targetType="event"
              initialReviews={reviews}
              isAuthenticated={!!user}
            />
          </div>

          {/* ── RIGHT: sticky sidebar ── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">

            {/* Ticket selector */}
            <TicketSelector
              eventId={event.id}
              price={event.price}
              capacity={event.capacity}
              sold={event.tickets_sold}
              slug={event.slug}
            />

            {/* Capacity summary */}
            {!event.tickets_sold || spotsLeft > 0 ? (
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/50 text-xs uppercase tracking-wide">Availability</span>
                  <span className="text-white/70 text-xs">
                    {event.tickets_sold} / {event.capacity} tickets sold
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-primary transition-all duration-700"
                    style={{
                      width: `${Math.round((event.tickets_sold / event.capacity) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* Share (desktop sidebar) */}
            <div className="hidden lg:block glass-card rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Share this event</p>
              <ShareButtons title={event.title} slug={event.slug} />
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
