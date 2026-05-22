'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PricingTiers from '@/components/trips/PricingTiers'
import type { TripRow, TripTier } from '@/types/database'

interface Props {
  trip:      TripRow
  seatsLeft: number
}

export default function BookingWrapper({ trip, seatsLeft }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [promoCode,  setPromoCode]   = useState('')
  const [promoLabel, setPromoLabel]  = useState('')
  const [error, setError]            = useState('')

  function handlePromoApplied(code: string, label: string) {
    setPromoCode(code)
    setPromoLabel(label)
  }

  function handlePromoClear() {
    setPromoCode('')
    setPromoLabel('')
  }

  function handleBook(tier: TripTier) {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/create-checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            type:   'trip',
            itemId: trip.id,
            tier,
            ...(promoCode ? { promoCode } : {}),
          }),
        })
        const data = await res.json()
        if (data.url) {
          router.push(data.url)
        } else {
          setError(data.error ?? 'Something went wrong.')
        }
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  return (
    <>
      <PricingTiers
        trip={trip}
        onBook={handleBook}
        isPending={isPending}
        seatsLeft={seatsLeft}
        promoCode={promoCode}
        promoLabel={promoLabel}
        onPromoApplied={handlePromoApplied}
        onPromoClear={handlePromoClear}
      />
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </>
  )
}
