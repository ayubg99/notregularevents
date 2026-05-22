'use client'

import { useState } from 'react'
import BookingModal from '@/components/booking/BookingModal'

interface Props {
  eventId:  string
  price:    number
  capacity: number
  sold:     number
  slug:     string
  title:    string
}

export default function TicketSelector({ eventId, price, capacity, sold, slug, title }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  // Suppress unused variable warning — slug kept for possible future use
  void slug

  const spotsLeft = capacity - sold
  const isSoldOut = spotsLeft <= 0
  const isFree    = price === 0

  if (isSoldOut) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <p className="font-heading text-xl font-bold text-white mb-1">Sold Out</p>
        <p className="text-white/50 text-sm">This event is fully booked.</p>
      </div>
    )
  }

  return (
    <>
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
        {/* Price */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-heading text-2xl font-bold text-white">
              {isFree ? 'Free Entry' : `€${price.toFixed(2)}`}
              {!isFree && <span className="text-white/40 text-sm font-normal ml-1">/ ticket</span>}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} remaining
            </p>
          </div>
          {!isFree && (
            <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
              Standard
            </span>
          )}
        </div>

        {/* Book button */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 rounded-full btn-primary font-semibold text-sm shadow-brand-sm hover:brightness-105 transition-all"
        >
          {isFree ? "RSVP — It's Free!" : 'Book Tickets'}
        </button>

        <p className="text-center text-white/25 text-xs -mt-1">
          {isFree ? 'Instant confirmation' : 'Secure checkout via Stripe'}
        </p>
      </div>

      <BookingModal
        type="event"
        eventId={eventId}
        price={price}
        capacity={capacity}
        sold={sold}
        slug={slug}
        title={title}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
