'use client'

import { useState, useMemo } from 'react'
import { Lock } from 'lucide-react'
import BookingModal from '@/components/booking/BookingModal'
import type { EventTicketTier } from '@/types/database'
import { tierDefaults } from '@/types/database'

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
  userIsMember?:        boolean
  tierSoldCounts?:      Record<string, number>
  eventDate?:           string | null
}

function isTierExpired(tier: EventTicketTier, eventDate?: string | null): boolean {
  if (!tier.valid_until_time || !eventDate) return false
  const [hh, mm] = tier.valid_until_time.split(':').map(Number)
  const cutoff   = new Date(eventDate)
  cutoff.setHours(hh, mm, 0, 0)
  if (hh < 12) cutoff.setDate(cutoff.getDate() + 1)
  return new Date() > cutoff
}

export default function TicketSelector({
  eventId, price, capacity, sold, slug, title, isFree: isFreeProp, isMembersOnlyFree,
  priceEarlyBird, priceGroup, earlyBirdDeadline, earlyBirdSeats, earlyBirdSeatsSold,
  ticketTiers, userIsMember, tierSoldCounts, eventDate,
}: Props) {
  const [modalOpen,       setModalOpen]       = useState(false)
  const [selectedTierIdx, setSelectedTierIdx] = useState(0)

  void slug

  const spotsLeft = capacity - sold
  const isSoldOut = spotsLeft <= 0

  // ── Custom tiers path ────────────────────────────────────────
  const hasTiers = !!ticketTiers && ticketTiers.length > 0

  // Normalise all tiers and compute visibility / locked state
  const enrichedTiers = useMemo(() => {
    if (!ticketTiers?.length) return []
    const normalised = ticketTiers.map(tierDefaults)
    return normalised.map(tier => {
      const soldCount  = tierSoldCounts?.[tier.name] ?? 0
      const isSoldOut  = tier.seats !== null && soldCount >= tier.seats
      const isLocked   = tier.members_only && !userIsMember
      const isExpired  = isTierExpired(tier, eventDate)

      // Hidden until its prerequisite tier sells out
      let isHidden = false
      if (tier.activates_after) {
        const prereq = normalised.find(t => t.id === tier.activates_after)
        if (prereq) {
          const prereqSold = tierSoldCounts?.[prereq.name] ?? 0
          isHidden = prereq.seats === null || prereqSold < prereq.seats
        }
      }

      const spotsLeft = tier.seats !== null ? Math.max(0, tier.seats - soldCount) : null
      return { tier, soldCount, isSoldOut, isLocked, isExpired, isHidden, spotsLeft }
    })
  }, [ticketTiers, tierSoldCounts, userIsMember, eventDate])

  const visibleTiers = enrichedTiers.filter(e => !e.isHidden)

  // Keep selectedTierIdx pointing at a valid visible tier
  const safeIdx = Math.min(selectedTierIdx, Math.max(0, visibleTiers.length - 1))
  const selectedEntry = visibleTiers[safeIdx]

  if (isSoldOut) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <p className="font-heading text-xl font-bold text-white mb-1">Sold Out</p>
        <p className="text-white/50 text-sm">This event is fully booked.</p>
      </div>
    )
  }

  if (hasTiers && visibleTiers.length > 0) {
    const selected    = selectedEntry?.tier
    const isTierFree  = selected?.price === 0
    const isDisabled  = !selectedEntry || selectedEntry.isSoldOut || selectedEntry.isLocked || selectedEntry.isExpired

    return (
      <>
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono font-bold text-[13px] uppercase tracking-[0.05em] text-white">Get Tickets</h2>
            <span className="text-white/40 text-xs">{spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left</span>
          </div>

          <div className="flex flex-col gap-2">
            {visibleTiers.map((entry, i) => {
              const { tier, isSoldOut: tierSoldOut, isLocked, isExpired, spotsLeft: tierSpots } = entry
              const isDisabledTier = tierSoldOut || isLocked || isExpired
              return (
                <button
                  key={tier.id}
                  onClick={() => !isDisabledTier && setSelectedTierIdx(i)}
                  disabled={isDisabledTier}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    isDisabledTier
                      ? 'border-white/5 bg-white/3 opacity-50 cursor-not-allowed'
                      : safeIdx === i
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Name + badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="text-white font-semibold text-sm">{tier.name}</span>
                        {tier.price === 0 && !tierSoldOut && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                            Free
                          </span>
                        )}
                        {isLocked && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            <Lock size={9} />Members only
                          </span>
                        )}
                        {tierSoldOut && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/40">
                            Sold Out
                          </span>
                        )}
                        {isExpired && !tierSoldOut && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400">
                            Unavailable
                          </span>
                        )}
                        {tier.valid_until_time && !isExpired && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-accent/10 text-brand-accent/80 border border-brand-accent/20">
                            Before {tier.valid_until_time}
                          </span>
                        )}
                        {tier.min_group_size && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400/80 border border-cyan-500/20">
                            Min {tier.min_group_size} people
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {tier.description && (
                        <p className="text-white/50 text-xs">{tier.description}</p>
                      )}

                      {/* Benefits */}
                      {tier.benefits.length > 0 && (
                        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          {tier.benefits.map(b => (
                            <li key={b} className="text-[11px] text-white/40 before:content-['✓'] before:mr-1 before:text-green-400/70">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Per-tier spots left */}
                      {tierSpots !== null && !tierSoldOut && (
                        <p className="text-[10px] text-white/30 mt-1">{tierSpots} spot{tierSpots === 1 ? '' : 's'} left</p>
                      )}
                    </div>

                    <span className={`font-bold text-base flex-shrink-0 ${isDisabledTier ? 'text-white/30' : 'text-white'}`}>
                      {tierSoldOut ? '—' : tier.price === 0 ? 'Free' : `€${tier.price.toFixed(2)}`}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            disabled={isDisabled}
            className="w-full py-3.5 rounded-full btn-primary font-semibold text-sm shadow-brand-sm hover:brightness-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
          initialTierIdx={safeIdx}
          userIsMember={userIsMember}
          tierSoldCounts={tierSoldCounts}
          eventDate={eventDate}
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
