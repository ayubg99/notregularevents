'use client'

import { useState } from 'react'
import { Check, Zap, Star, Users, Tag, Loader2, X } from 'lucide-react'
import type { TripRow, TripTier } from '@/types/database'

interface Props {
  trip:            TripRow
  onBook:          (tier: TripTier) => void
  isPending:       boolean
  seatsLeft:       number
  promoCode?:      string
  promoLabel?:     string
  onPromoApplied?: (code: string, label: string, discountedUnit: number) => void
  onPromoClear?:   () => void
}

interface TierDef {
  key:         TripTier
  label:       string
  price:       number
  badge?:      string
  badgeColor?: string
  icon:        React.ReactNode
  perks:       string[]
}

export default function PricingTiers({
  trip, onBook, isPending, seatsLeft,
  promoCode, promoLabel, onPromoApplied, onPromoClear,
}: Props) {
  const [selected, setSelected]        = useState<TripTier>('standard')
  const [promoOpen, setPromoOpen]      = useState(false)
  const [promoInput, setPromoInput]    = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError]    = useState('')

  const tiers: TierDef[] = [
    ...(trip.price_early_bird != null ? [{
      key:        'early_bird' as TripTier,
      label:      'Early Bird',
      price:      trip.price_early_bird,
      badge:      'Best Value',
      badgeColor: 'bg-brand-accent/20 text-brand-accent border-brand-accent/30',
      icon:       <Zap size={16} />,
      perks:      ['Limited availability', 'Full trip included', 'Save vs standard'],
    }] : []),
    {
      key:   'standard',
      label: 'Standard',
      price: trip.price_standard,
      icon:  <Check size={16} />,
      perks: ['Full trip included', 'Group activities', 'Accommodation'],
    },
    ...(trip.price_vip != null ? [{
      key:        'vip' as TripTier,
      label:      'VIP',
      price:      trip.price_vip,
      badge:      'Premium',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon:       <Star size={16} />,
      perks:      ['Priority boarding', 'Upgraded room', 'Exclusive experiences'],
    }] : []),
    ...(trip.price_group != null ? [{
      key:        'group' as TripTier,
      label:      'Group',
      price:      trip.price_group,
      badge:      'Group Deal',
      badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
      icon:       <Users size={16} />,
      perks:      ['4+ people', 'Group discount', 'Shared accommodation'],
    }] : []),
  ]

  const soldOut = seatsLeft === 0

  async function applyPromo() {
    if (!promoInput.trim() || !onPromoApplied) return
    const selectedTier = tiers.find(t => t.key === selected)
    const basePrice = selectedTier?.price ?? trip.price_standard
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await fetch(
        `/api/stripe/validate-promo?code=${encodeURIComponent(promoInput)}&price=${basePrice}&quantity=1`,
      )
      const data = await res.json()
      if (data.valid) {
        onPromoApplied(promoInput.trim(), data.discountLabel, data.discountedUnit)
        setPromoError('')
      } else {
        setPromoError(data.error ?? 'Invalid code.')
      }
    } catch {
      setPromoError('Could not validate code.')
    } finally {
      setPromoLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="font-heading text-lg font-bold text-white">Choose Your Tier</h2>

      <div className="flex flex-col gap-2">
        {tiers.map((tier) => (
          <button
            key={tier.key}
            onClick={() => setSelected(tier.key)}
            disabled={soldOut || isPending}
            className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
              selected === tier.key
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            } ${soldOut || isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`${selected === tier.key ? 'text-brand-primary' : 'text-white/40'}`}>
                  {tier.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{tier.label}</span>
                    {tier.badge && (
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${tier.badgeColor}`}>
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="text-white/40 text-xs">{perk}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <span className="text-white font-bold text-lg flex-shrink-0">
                {tier.price === 0 ? 'Free' : `€${tier.price}`}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Promo code */}
      {onPromoApplied && (
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
              {promoError && <p className="text-red-400 text-xs mt-1.5">{promoError}</p>}
            </>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2">
              <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                <Check size={13} />
                {promoLabel}
              </div>
              <button onClick={onPromoClear} className="text-white/40 hover:text-white transition-colors">
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onBook(selected)}
        disabled={soldOut || isPending}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
          soldOut
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : isPending
            ? 'bg-brand-primary/60 text-brand-dark cursor-wait'
            : 'bg-brand-primary text-brand-dark hover:bg-brand-primary/90 active:scale-[0.98]'
        }`}
      >
        {soldOut ? 'Fully Booked' : isPending ? 'Redirecting…' : 'Book Now'}
      </button>
    </div>
  )
}
