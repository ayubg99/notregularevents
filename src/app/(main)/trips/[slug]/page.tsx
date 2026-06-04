import type { Metadata } from'next'
import Image from'next/image'
import Link from'next/link'
import { notFound } from'next/navigation'
import { ArrowLeft, Calendar, MapPin, MessageCircle } from'lucide-react'
import { getTripBySlug, getTripReviews } from'@/lib/supabase/queries'
import { createClient } from'@/lib/supabase/server'
import CountdownTimer from'@/components/events/CountdownTimer'
import ShareButtons from'@/components/events/ShareButtons'
import SeatCounter from'@/components/trips/SeatCounter'
import BookingWrapper from'@/components/trips/BookingWrapper'
import TripTabs from'@/components/trips/TripTabs'
import GalleryStrip from'@/components/shared/GalleryStrip'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ booked?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trip = await getTripBySlug(slug)
  if (!trip) return { title:'Trip Not Found' }

  const description = trip.description?.slice(0, 155) ??`Join Erasmus Life on a trip to ${trip.destination}`

  return {
    title:`${trip.title} | Erasmus Life Valencia`,
    description,
    openGraph: {
      title: trip.title,
      description,
      type:'website',
      images: trip.image_url ? [{ url: trip.image_url }] : [],
    },
  }
}

export default async function TripDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { booked } = await searchParams

  const trip = await getTripBySlug(slug)
  if (!trip) notFound()

  const [reviews, supabase] = await Promise.all([
    getTripReviews(trip.id),
    createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()

  const isPast = new Date(trip.end_date) < new Date()
  const seatsLeft = trip.capacity - trip.seats_sold

  const startLong = new Date(trip.start_date).toLocaleDateString('en-GB', {
    day:'numeric', month:'long', year:'numeric',
  })
  const endLong = new Date(trip.end_date).toLocaleDateString('en-GB', {
    day:'numeric', month:'long', year:'numeric',
  })

  return (
    <main className="min-h-screen bg-brand-dark">

      {/* Hero */}
      <div className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden">
        {trip.image_url ? (
          <Image
            src={trip.image_url}
            alt={trip.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/40 to-brand-accent/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent" />

        {/* Back link */}
        <div className="absolute top-0 left-0 right-0 pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              All trips
            </Link>
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-white/80 text-xs">
                <MapPin size={11} />
                {trip.destination}
              </span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">
              {trip.title}
            </h1>
            <p className="mt-2 text-white/60 text-sm flex items-center gap-1.5">
              <Calendar size={13} />
              {startLong} – {endLong}
            </p>
          </div>
        </div>
      </div>

      {/* Gallery strip */}
      {(trip.gallery_images?.length ?? 0) > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <GalleryStrip images={trip.gallery_images!} />
        </div>
      )}

      {/* Content grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* LEFT */}
          <div className="flex flex-col gap-8">
            {!isPast && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Departure in</p>
                <CountdownTimer targetDate={trip.start_date} />
              </div>
            )}
            <TripTabs trip={trip} reviews={reviews} isAuthenticated={!!user} />
          </div>

          {/* RIGHT: sticky sidebar */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">

            {/* Booking confirmed banner */}
            {booked ==='true' && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
                <p className="text-green-400 font-semibold text-sm">Booking confirmed!</p>
                <p className="text-white/60 text-xs mt-1">Check your email for details.</p>
                {trip.whatsapp_group_url && (
                  <a
                    href={trip.whatsapp_group_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold transition-colors"
                  >
                    <MessageCircle size={13} />
                    Join WhatsApp Group
                  </a>
                )}
              </div>
            )}

            {/* Realtime seat counter */}
            <SeatCounter
              tripId={trip.id}
              initialSeats={trip.seats_sold}
              capacity={trip.capacity}
            />

            {/* Booking (client boundary) */}
            <BookingWrapper trip={trip} seatsLeft={seatsLeft} />

            {/* WhatsApp teaser (pre-booking) */}
            {trip.whatsapp_group_url && booked !=='true' && (
              <div className="glass-card rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Community</p>
                <a
                  href={trip.whatsapp_group_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                >
                  <MessageCircle size={14} />
                  Join the WhatsApp group
                </a>
              </div>
            )}

            {/* Share */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Share this trip</p>
              <ShareButtons title={trip.title} slug={`trips/${trip.slug}`} />
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
