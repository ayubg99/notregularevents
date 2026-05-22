'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Tag, Check, Minus, Plus, Crown, User, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TripRow, TripTier } from '@/types/database'

type EventProps = {
  type:     'event'
  eventId:  string
  price:    number
  capacity: number
  sold:     number
  slug:     string
  title:    string
}

type TripProps = {
  type:      'trip'
  trip:      TripRow
  seatsLeft: number
}

type Props = (EventProps | TripProps) & {
  open:         boolean
  onClose:      () => void
  initialTier?: TripTier
}

const TIER_LABELS: Record<TripTier, string> = {
  early_bird: 'Early Bird',
  standard:   'Standard',
  vip:        'VIP',
  group:      'Group',
}

function MembershipBanner({
  authLoaded,
  isLoggedIn,
  isMember,
}: {
  authLoaded: boolean
  isLoggedIn: boolean
  isMember:   boolean
}) {
  if (!authLoaded) return null

  if (isMember) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/25 px-4 py-3">
        <Crown size={15} className="text-brand-primary flex-shrink-0" />
        <p className="text-brand-primary text-sm font-semibold">
          15% member discount applied
        </p>
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <a
        href="/membership"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 hover:border-brand-primary/30 transition-colors group"
      >
        <Crown size={15} className="text-brand-primary/50 group-hover:text-brand-primary flex-shrink-0 mt-0.5 transition-colors" />
        <p className="text-white/50 group-hover:text-white/70 text-sm transition-colors">
          Join membership for <span className="font-semibold text-white/70">€9.99/month</span> and save 15% on every booking
        </p>
      </a>
    )
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <Crown size={15} className="text-brand-primary/50 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-white/50 text-sm">
          Members save 15% —{' '}
          <a href="/auth/login" className="text-brand-primary hover:underline font-medium">
            <LogIn size={11} className="inline mb-0.5 mr-0.5" />Log in
          </a>
          {' '}or{' '}
          <a href="/membership" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">
            join
          </a>
          {' '}to get the discount
        </p>
      </div>
    </div>
  )
}

export default function BookingModal(props: Props) {
  const { open, onClose } = props
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Guest fields
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [authEmail, setAuthEmail] = useState<string | null>(null)

  // Auth / membership state
  const [authLoaded, setAuthLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMember,   setIsMember]   = useState(false)

  // Quantity (events)
  const [quantity, setQuantity] = useState(1)

  // Tier (trips)
  const [selectedTier, setSelectedTier] = useState<TripTier>(
    props.type === 'trip' ? (props.initialTier ?? 'standard') : 'standard',
  )

  // Promo
  const [promoOpen,    setPromoOpen]    = useState(false)
  const [promoInput,   setPromoInput]   = useState('')
  const [promoCode,    setPromoCode]    = useState('')
  const [promoLabel,   setPromoLabel]   = useState('')
  const [promoUnit,    setPromoUnit]    = useState<number | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError,   setPromoError]   = useState('')

  const [error, setError] = useState('')

  // Check auth + membership on open
  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setAuthLoaded(true)
        return
      }
      setIsLoggedIn(true)
      setAuthEmail(user.email ?? null)
      if (user.email && !email) setEmail(user.email)
      if (user.user_metadata?.full_name && !name) setName(user.user_metadata.full_name)

      // Check membership — status column is source of truth for subscriptions
      const [{ data: mem }, { data: profile }] = await Promise.all([
        supabase
          .from('memberships')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('membership_status')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])
      if (mem || profile?.membership_status === 'active') setIsMember(true)
      setAuthLoaded(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  // ── Derived prices ──────────────────────────────────────────
  let basePrice = 0
  let spotsLeft = 0

  if (props.type === 'event') {
    basePrice = props.price
    spotsLeft = props.capacity - props.sold
  } else {
    const tierPrices: Record<TripTier, number> = {
      early_bird: props.trip.price_early_bird ?? props.trip.price_standard,
      standard:   props.trip.price_standard,
      vip:        props.trip.price_vip        ?? props.trip.price_standard,
      group:      props.trip.price_group      ?? props.trip.price_standard,
    }
    basePrice = tierPrices[selectedTier]
    spotsLeft = props.seatsLeft
  }

  // Member discount applies only when isMember AND no promo is active
  let displayPrice = promoUnit ?? basePrice
  if (isMember && !promoCode) {
    displayPrice = +(displayPrice * 0.85).toFixed(2)
  }
  const hasDiscount = isMember && !promoCode && basePrice > 0
  const isFree      = displayPrice === 0
  const qty         = props.type === 'event' ? quantity : 1
  const total       = displayPrice * qty
  const max         = Math.min(spotsLeft, 10)

  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await fetch(
        `/api/stripe/validate-promo?code=${encodeURIComponent(promoInput)}&price=${basePrice}&quantity=${qty}`,
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
    setPromoCode(''); setPromoUnit(null); setPromoLabel('')
    setPromoInput(''); setPromoError('')
  }

  function handleBook() {
    if (!name.trim())  { setError('Please enter your name.');  return }
    if (!email.trim()) { setError('Please enter your email.'); return }
    setError('')

    startTransition(async () => {
      try {
        const tier = props.type === 'trip' ? selectedTier : undefined
        const res = await fetch('/api/stripe/create-checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type:        props.type,
            itemId:      props.type === 'event' ? props.eventId : props.trip.id,
            ...(tier                           ? { tier }      : {}),
            ...(props.type === 'event'         ? { quantity }  : {}),
            ...(promoCode                      ? { promoCode } : {}),
            guestName:  name.trim(),
            guestEmail: email.trim(),
            guestPhone: phone.trim() || undefined,
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

  const title = props.type === 'event' ? props.title : props.trip.title

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-[#1A1209] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-[#1A1209] z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">
              {props.type === 'trip' ? 'Book Trip' : 'Get Tickets'}
            </p>
            <h2 className="font-heading text-lg font-bold text-white leading-tight line-clamp-1">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-8 pt-5 flex flex-col gap-5">

          <MembershipBanner authLoaded={authLoaded} isLoggedIn={isLoggedIn} isMember={isMember} />

          {/* Tier selector (trips) */}
          {props.type === 'trip' && (
            <div className="flex flex-col gap-2">
              <p className="text-white/50 text-xs uppercase tracking-widest">Select tier</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TIER_LABELS) as TripTier[]).map(t => {
                  const tierPrices: Record<TripTier, number | null> = {
                    early_bird: props.trip.price_early_bird,
                    standard:   props.trip.price_standard,
                    vip:        props.trip.price_vip,
                    group:      props.trip.price_group,
                  }
                  const p = tierPrices[t]
                  if (p === null || p === undefined) return null
                  const memberP = isMember ? +(p * 0.85).toFixed(2) : null
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                        selectedTier === t
                          ? 'border-brand-primary bg-brand-primary/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <p className="text-xs font-semibold">{TIER_LABELS[t]}</p>
                      {memberP ? (
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <p className="text-sm font-bold">€{memberP.toFixed(2)}</p>
                          <p className="text-xs line-through text-white/30">€{p.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold mt-0.5">€{p.toFixed(2)}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity (events, paid) */}
          {props.type === 'event' && !isFree && (
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brand-primary transition-colors disabled:opacity-30"
                >
                  <Minus size={13} />
                </button>
                <span className="font-bold text-white w-5 text-center tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(max, q + 1))}
                  disabled={quantity >= max}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brand-primary transition-colors disabled:opacity-30"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Promo code */}
          {!isFree && (
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
                        className="flex-1 px-3 py-2 rounded-xl text-sm uppercase border border-white/10 bg-white/5 text-white placeholder:text-white/25 tracking-widest focus:outline-none focus:border-brand-primary/50 transition-colors"
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
                  {promoError && <p className="text-red-400 text-xs mt-1.5">{promoError}</p>}
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
          )}

          {/* Guest details */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest">
              <User size={12} />
              Your details
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name *"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address *"
              disabled={!!authEmail}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
            />
          </div>

          {/* Price summary */}
          {!isFree && (
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-white/60 text-sm">Total</span>
              <div className="text-right">
                {(hasDiscount || promoCode) && (
                  <p className="text-white/30 text-xs line-through">
                    €{(basePrice * qty).toFixed(2)}
                  </p>
                )}
                <span className="font-heading text-2xl font-bold text-white">
                  €{total.toFixed(2)}
                </span>
                {hasDiscount && (
                  <p className="text-brand-primary text-xs mt-0.5">Member price (−15%)</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Submit */}
          <button
            onClick={handleBook}
            disabled={isPending}
            className="w-full py-4 rounded-full btn-primary font-bold text-sm shadow-brand-sm hover:brightness-105 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Processing…</>
            ) : isFree ? (
              "RSVP — It's Free!"
            ) : (
              'Proceed to Payment →'
            )}
          </button>

          <p className="text-center text-white/25 text-xs -mt-2">
            {isFree ? 'Instant confirmation, no payment needed' : 'Secure checkout via Stripe'}
          </p>
        </div>
      </div>
    </div>
  )
}
