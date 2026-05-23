'use client'

import { useState } from 'react'
import PricingTiers from '@/components/trips/PricingTiers'
import BookingModal from '@/components/booking/BookingModal'
import type { TripRow, TripTier } from '@/types/database'

interface Props {
  trip:      TripRow
  seatsLeft: number
}

export default function BookingWrapper({ trip, seatsLeft }: Props) {
  const [modalOpen,    setModalOpen]    = useState(false)
  const [selectedTier, setSelectedTier] = useState<TripTier>('standard')
  const [groupSize,    setGroupSize]    = useState(4)
  const [promoCode,    setPromoCode]    = useState('')
  const [promoLabel,   setPromoLabel]   = useState('')

  function handlePromoApplied(code: string, label: string) {
    setPromoCode(code)
    setPromoLabel(label)
  }

  function handlePromoClear() {
    setPromoCode('')
    setPromoLabel('')
  }

  function handleBook(tier: TripTier, size?: number) {
    setSelectedTier(tier)
    if (size !== undefined) setGroupSize(size)
    setModalOpen(true)
  }

  return (
    <>
      <PricingTiers
        trip={trip}
        onBook={handleBook}
        isPending={false}
        seatsLeft={seatsLeft}
        promoCode={promoCode}
        promoLabel={promoLabel}
        onPromoApplied={handlePromoApplied}
        onPromoClear={handlePromoClear}
      />

      <BookingModal
        type="trip"
        trip={trip}
        seatsLeft={seatsLeft}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTier={selectedTier}
        groupSize={groupSize}
      />
    </>
  )
}
