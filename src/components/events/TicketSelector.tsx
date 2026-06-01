'use client'

import { useState } from 'react'
import BookingModal from '@/components/booking/BookingModal'
import type { EventTicketTier } from '@/types/database'

interface Props {
  eventId:              string
  price:                number
  capacity:             number
  sold:                 number
  slug:                 string
  title:                string
  isFree?:              boolean
  isMembersOnlyFree?:   boolean
  priceEarlyBird?:      number | null
  priceGroup?:          number | null
  earlyBirdDeadline?:   string | null
  earlyBirdSeats?:      number
  earlyBirdSeatsSold?:  number
  ticketTiers?:         EventTicketTier[]
}

export default function TicketSelector({
  eventId, price, capacity, sold, slug, title, isFree: isFreeProp, isMembersOnlyFree,
  priceEarlyBird, priceGroup, earlyBirdDeadline, earlyBirdSeats, earlyBirdSeatsSold,
  ticketTiers,
}: Props) {
  const [modalOpen,       setModalOpen]       = useState(false)
  const [selectedTierIdx, setSelectedTierIdx] = useState(0)

  void slug

  const spotsLeft = capacity - sold
  const isSoldOut = spotsLeft <= 0

  // ── Custom tiers path ────────────────────────────────────────
  const hasTiers = !!ticketTiers && ticketTiers.length > 0

  if (isSoldOut) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <p className="font-heading text-xl font-bold text-white mb-1">Sold Out</p>
        <p className="text-white/50 text-sm">This event is fully booked.</p>
      </div>
    )
  }

  if (hasTiers) {
    const selected    = ticketTiers[selectedTierIdx]
    const isTierFree  = selected.price === 0

    return (
      <>
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-white">Get Tickets</h2>
            <span className="text-white/40 text-xs">{spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left</span>
          </div>

          <div className="flex flex-col gap-2">
            {ticketTiers.map((tier, i) => (
              <button
                key={i}
                onClick={() => setSelectedTierIdx(i)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                  selectedTierIdx === i
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{tier.name}</span>
                      {tier.price === 0 && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                          Free
                        </span>
                      )}
                    </div>
                    {tier.description && (
                      <p className="text-white/50 text-xs mt-0.5">{tier.description}</p>
                    )}
                  </div>
                  <span className="font-bold text-white text-base flex-shrink-0">
                    {tier.price === 0 ? 'Free' : `€${tier.price.toFixed(2)}`}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-3.5 rounded-full btn-primary font-semibold text-sm shadow-brand-sm hover:brightness-105 transition-all"
          >
            {isTierFree ? "RSVP — It's Free!" : 'Book Tickets'}
          </button>

          <p className="text-center text-white/25 text-xs -mt-1">
            {isTierFree ? 'Instant confirmation, no payment needed' : 'Secure checkout via Stripe'}
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
          isFree={false}
          isMembersOnlyFree={isMembersOnlyFree}
          priceEarlyBird={priceEarlyBird}
          priceGroup={priceGroup}
          earlyBirdDeadline={earlyBirdDeadline}
          earlyBirdSeats={earlyBirdSeats}
          earlyBirdSeatsSold={earlyBirdSeatsSold}
          ticketTiers={ticketTiers}
          initialTierIdx={selectedTierIdx}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </>
    )
  }

  // ── Legacy path (no custom tiers) ───────────────────────────
  const isFree = isFreeProp ?? price === 0

  const isEarlyBirdValid =
    !!priceEarlyBird &&
    !!earlyBirdDeadline &&
    new Date(earlyBirdDeadline) > new Date() &&
    ((earlyBirdSeats ?? 0) - (earlyBirdSeatsSold ?? 0)) > 0

  const displayPrice = isEarlyBirdValid ? priceEarlyBird! : price

  return (
    <>
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-heading text-2xl font-bold text-white">
              {isMembersOnlyFree ? 'Members Only — Free' : isFree ? 'Free Entry' : `€${displayPrice.toFixed(2)}`}
              {!isFree && !isMembersOnlyFree && <span className="text-white/40 text-sm font-normal ml-1">/ ticket</span>}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {isMembersOnlyFree ? 'Active membership required' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining`}
            </p>
          </div>
          {!isFree && !isMembersOnlyFree && (
            <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
              {isEarlyBirdValid ? '🔥 Early Bird' : 'Standard'}
            </span>
          )}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 rounded-full btn-primary font-semibold text-sm shadow-brand-sm hover:brightness-105 transition-all"
        >
          {isMembersOnlyFree ? '👑 Register — Members Only' : isFree ? "RSVP — It's Free!" : 'Book Tickets'}
        </button>

        <p className="text-center text-white/25 text-xs -mt-1">
          {isMembersOnlyFree ? 'Membership verified at checkout' : isFree ? 'Instant confirmation' : 'Secure checkout via Stripe'}
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
        isFree={isFree}
        isMembersOnlyFree={isMembersOnlyFree}
        priceEarlyBird={priceEarlyBird}
        priceGroup={priceGroup}
        earlyBirdDeadline={earlyBirdDeadline}
        earlyBirdSeats={earlyBirdSeats}
        earlyBirdSeatsSold={earlyBirdSeatsSold}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
