'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus, Loader2, Lock, Tag, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  eventId:  string
  price:    number
  capacity: number
  sold:     number
  slug:     string
}

export default function TicketSelector({ eventId, price, capacity, sold, slug }: Props) {
  const [quantity, setQuantity]          = useState(1)
  const [error, setError]                = useState('')
  const [isPending, startTransition]     = useTransition()
  const [promoOpen, setPromoOpen]        = useState(false)
  const [promoInput, setPromoInput]      = useState('')
  const [promoCode, setPromoCode]        = useState('')
  const [promoLabel, setPromoLabel]      = useState('')
  const [promoUnit, setPromoUnit]        = useState<number | null>(null)
  const [promoLoading, setPromoLoading]  = useState(false)
  const [promoError, setPromoError]      = useState('')
  const router = useRouter()

  const spotsLeft = capacity - sold
  const isSoldOut = spotsLeft <= 0
  const isFree    = price === 0
  const max       = Math.min(spotsLeft, 10)
  const unitPrice = promoUnit ?? price
  const total     = unitPrice * quantity

  // Suppress unused variable warning — slug is kept for backward compat
  void slug

  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await fetch(
        `/api/stripe/validate-promo?code=${encodeURIComponent(promoInput)}&price=${price}&quantity=${quantity}`,
      )
      const data = await res.json()
      if (data.valid) {
        setPromoCode(promoInput.trim())
        setPromoUnit(data.discountedUnit)
        setPromoLabel(data.discountLabel)
        setPromoError('')
      } else {
        setPromoError(data.error ?? 'Invalid promo code.')
      }
    } catch {
      setPromoError('Could not validate code. Try again.')
    } finally {
      setPromoLoading(false)
    }
  }

  function clearPromo() {
    setPromoCode('')
    setPromoUnit(null)
    setPromoLabel('')
    setPromoInput('')
    setPromoError('')
  }

  function handleBook() {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/create-checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            type:   'event',
            itemId: eventId,
            quantity,
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

  if (isSoldOut) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <p className="font-heading text-xl font-bold text-white mb-1">Sold Out</p>
        <p className="text-white/50 text-sm">This event is fully booked.</p>
      </div>
    )
  }

  return (
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

      {/* Quantity selector (paid events only) */}
      {!isFree && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brand-primary hover:text-brand-primary transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={13} />
              </button>
              <span className="font-bold text-white text-lg w-6 text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(max, q + 1))}
                disabled={quantity >= max}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brand-primary hover:text-brand-primary transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Promo code */}
          <div>
            {!promoCode ? (
              <>
                <button
                  onClick={() => setPromoOpen(o => !o)}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
                >
                  <Tag size={12} />
                  Have a promo code?
                </button>

                {promoOpen && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      placeholder="PROMO CODE"
                      className="
                        flex-1 px-3 py-2 rounded-xl text-sm uppercase
                        border border-white/10 bg-white/5
                        text-white placeholder:text-white/25 tracking-widest
                        focus:outline-none focus:border-brand-primary/50
                        transition-colors
                      "
                    />
                    <button
                      onClick={applyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 text-white transition-colors disabled:opacity-40"
                    >
                      {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="text-red-400 text-xs mt-1.5">{promoError}</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2">
                <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                  <Check size={13} />
                  {promoLabel}
                </div>
                <button onClick={clearPromo} className="text-white/40 hover:text-white transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-white/60 text-sm">Total</span>
            <div className="text-right">
              {promoCode && (
                <p className="text-white/30 text-xs line-through">€{(price * quantity).toFixed(2)}</p>
              )}
              <span className="font-heading text-2xl font-bold text-white">
                €{total.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm -mt-2 flex items-center gap-1.5">
          <Lock size={13} /> {error}
        </p>
      )}

      {/* Book button */}
      <button
        onClick={handleBook}
        disabled={isPending}
        className="w-full py-3.5 rounded-full bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-sm shadow-brand-sm hover:shadow-brand-md transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <><Loader2 size={15} className="animate-spin" /> Processing…</>
        ) : isFree ? (
          "RSVP — It's Free!"
        ) : (
          `Book ${quantity} Ticket${quantity > 1 ? 's' : ''}`
        )}
      </button>

      <p className="text-center text-white/25 text-xs -mt-1">
        {isFree ? 'Instant confirmation' : 'Secure checkout via Stripe'}
      </p>
    </div>
  )
}
