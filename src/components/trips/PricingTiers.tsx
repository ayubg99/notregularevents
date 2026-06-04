'use client'

import { useState } from'react'
import { Check, Zap, Users, Tag, Loader2, X, Minus, Plus } from'lucide-react'
import type { TripRow, TripTier, TripExtra } from'@/types/database'

interface Props {
  trip: TripRow
  onBook: (tier: TripTier, groupSize?: number, extras?: TripExtra[]) => void
  isPending: boolean
  seatsLeft: number
  promoCode?: string
  promoLabel?: string
  onPromoApplied?: (code: string, label: string, discountedUnit: number) => void
  onPromoClear?: () => void
}

function getUrgency(deadline: string | null, seatsLeft: number): string | null {
  if (!deadline) return null
  const hoursLeft = (new Date(deadline).getTime() - Date.now()) / 3_600_000
  if (seatsLeft < 10) return` Only ${seatsLeft} early bird spot${seatsLeft === 1 ?'' :'s'} left!`
  if (hoursLeft < 48) return` Early bird ends in ${Math.ceil(hoursLeft)}h!`
  return null
}

export default function PricingTiers({
  trip, onBook, isPending, seatsLeft,
  promoCode, promoLabel, onPromoApplied, onPromoClear,
}: Props) {
  const ebSeatsLeft = trip.early_bird_seats - trip.early_bird_seats_sold
  const isEarlyBirdValid =
    !!trip.price_early_bird &&
    !!trip.early_bird_deadline &&
    new Date(trip.early_bird_deadline) > new Date() &&
    ebSeatsLeft > 0

  const [selected, setSelected] = useState<TripTier>(
    isEarlyBirdValid ?'early_bird' :'standard',
  )
  const [groupSize, setGroupSize] = useState(4)
  const [selectedExtras, setSelectedExtras] = useState<TripExtra[]>([])
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')

  const minGroupSize = trip.group_min_size ?? 4
  const isGroupAvailable = trip.price_group != null && seatsLeft >= minGroupSize

  const soldOut = seatsLeft === 0
  const urgency = isEarlyBirdValid
    ? getUrgency(trip.early_bird_deadline, ebSeatsLeft)
    : null

  function currentBasePrice(): number {
    if (selected ==='early_bird') return trip.price_early_bird ?? trip.price_standard
    if (selected ==='group') return trip.price_group ?? trip.price_standard
    return trip.price_standard
  }

  async function applyPromo() {
    if (!promoInput.trim() || !onPromoApplied) return
    setPromoLoading(true); setPromoError('')
    try {
      const res = await fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(promoInput)}&price=${currentBasePrice()}&quantity=1`)
      const data = await res.json()
      if (data.valid) {
        onPromoApplied(promoInput.trim(), data.discountLabel, data.discountedUnit)
        setPromoError('')
      } else {
        setPromoError(data.error ??'Invalid code.')
      }
    } catch {
      setPromoError('Could not validate code.')
    } finally {
      setPromoLoading(false)
    }
  }

  function toggleExtra(extra: TripExtra) {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra],
    )
  }

  function handleBook() {
    onBook(selected, selected ==='group' ? groupSize : undefined, selectedExtras)
  }

  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0)

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="font-heading text-lg font-bold text-white">Choose Your Tier</h2>

      {urgency && (
        <div className="rounded-xl bg-orange-500/10 border border-orange-500/25 px-3 py-2 text-orange-400 text-xs font-semibold">
          {urgency}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Early Bird */}
        {isEarlyBirdValid && (
          <button
            onClick={() => setSelected('early_bird')}
            disabled={soldOut || isPending}
            className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
              selected ==='early_bird'
                ?'border-brand-primary bg-brand-primary/10'
                :'border-white/10 bg-white/5 hover:border-white/20'
            } ${soldOut || isPending ?'opacity-50 cursor-not-allowed' :'cursor-pointer'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Zap size={16} className={selected ==='early_bird' ?'text-brand-primary' :'text-white/40'} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">Early Bird</span>
                    <span className="inline-block px-2 py-0.5 rounded-full border text-xs font-semibold bg-brand-accent/20 text-brand-accent border-brand-accent/30">
                       Best Value
                    </span>
                  </div>
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <li className="text-white/40 text-xs">Limited availability</li>
                    <li className="text-white/40 text-xs">Save vs standard</li>
                  </ul>
                </div>
              </div>
              <span className="text-white font-bold text-lg flex-shrink-0">
                €{trip.price_early_bird}
              </span>
            </div>
          </button>
        )}

        {/* Standard */}
        <button
          onClick={() => setSelected('standard')}
          disabled={soldOut || isPending}
          className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
            selected ==='standard'
              ?'border-brand-primary bg-brand-primary/10'
              :'border-white/10 bg-white/5 hover:border-white/20'
          } ${soldOut || isPending ?'opacity-50 cursor-not-allowed' :'cursor-pointer'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Check size={16} className={selected ==='standard' ?'text-brand-primary' :'text-white/40'} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Standard</span>
                  {!isEarlyBirdValid && (
                    <span className="inline-block px-2 py-0.5 rounded-full border text-xs font-semibold bg-brand-primary/15 text-brand-primary border-brand-primary/25">
                      Most Popular
                    </span>
                  )}
                </div>
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <li className="text-white/40 text-xs">Full trip included</li>
                  <li className="text-white/40 text-xs">Group activities</li>
                </ul>
              </div>
            </div>
            <span className="text-white font-bold text-lg flex-shrink-0">
              €{trip.price_standard}
            </span>
          </div>
        </button>

        {/* Group (4+) */}
        {isGroupAvailable && (
          <div
            onClick={() => !soldOut && !isPending && setSelected('group')}
            className={`w-full rounded-xl border p-4 transition-all duration-200 ${
              selected ==='group'
                ?'border-brand-primary bg-brand-primary/10'
                :'border-white/10 bg-white/5 hover:border-white/20'
            } ${soldOut || isPending ?'opacity-50 cursor-not-allowed' :'cursor-pointer'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Users size={16} className={selected ==='group' ?'text-brand-primary' :'text-white/40'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">Group (4+)</span>
                    <span className="inline-block px-2 py-0.5 rounded-full border text-xs font-semibold bg-green-500/20 text-green-300 border-green-500/30">
                      Group Deal
                    </span>
                  </div>
                  {selected ==='group' && (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={e => { e.stopPropagation(); setGroupSize(s => Math.max(4, s - 1)) }}
                          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brand-primary transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-bold text-white tabular-nums">{groupSize} people</span>
                        <button
                          onClick={e => { e.stopPropagation(); setGroupSize(s => Math.min(seatsLeft, 20, s + 1)) }}
                          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brand-primary transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="text-white/50 text-xs">
                        {groupSize} × €{trip.price_group} ={''}
                        <span className="text-white font-bold">€{(groupSize * trip.price_group!).toFixed(0)} total</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-white font-bold text-lg flex-shrink-0">
                €{trip.price_group}<span className="text-white/40 text-xs font-normal">/person</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Extras / Add-ons */}
      {(trip.extras?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2 pt-1 border-t border-white/8">
          <p className="text-white/40 text-xs uppercase tracking-widest">Optional Add-ons</p>
          {trip.extras!.map(extra => {
            const checked = selectedExtras.some(e => e.id === extra.id)
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => toggleExtra(extra)}
                disabled={soldOut || isPending}
                className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 ${
                  checked
                    ?'border-brand-primary bg-brand-primary/10'
                    :'border-white/10 bg-white/5 hover:border-white/20'
                } ${soldOut || isPending ?'opacity-50 cursor-not-allowed' :'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${checked ?'bg-brand-primary border-brand-primary' :'border-white/30'}`}>
                      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${checked ?'text-white' :'text-white/80'}`}>{extra.name}</p>
                      {extra.description && (
                        <p className="text-white/40 text-xs mt-0.5">{extra.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${checked ?'text-white' :'text-white/60'}`}>
                    {extra.price === 0 ? <span className="text-green-400 text-xs font-semibold">Free</span> :`+€${extra.price.toFixed(2)}`}
                  </span>
                </div>
              </button>
            )
          })}
          {extrasTotal > 0 && (
            <p className="text-white/40 text-xs text-right">
              Add-ons: <span className="text-brand-primary font-semibold">+€{extrasTotal.toFixed(2)}</span>
            </p>
          )}
        </div>
      )}

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
                    onKeyDown={e => e.key ==='Enter' && applyPromo()}
                    placeholder="PROMO CODE"
                    className="flex-1 px-3 py-2 rounded-xl text-sm uppercase border border-white/10 bg-white/5 text-white placeholder:text-white/25 tracking-widest focus:outline-none focus:border-brand-primary/50 transition-colors"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 text-white transition-colors disabled:opacity-40"
                  >
                    {promoLoading ? <Loader2 size={14} className="animate-spin" /> :'Apply'}
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
        onClick={handleBook}
        disabled={soldOut || isPending}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
          soldOut
            ?'bg-white/10 text-white/40 cursor-not-allowed'
            : isPending
            ?'bg-brand-primary/60 text-brand-dark cursor-wait'
            :'bg-brand-primary text-brand-dark hover:bg-brand-primary/90 active:scale-[0.98]'
        }`}
      >
        {soldOut ?'Fully Booked' : isPending ?'Redirecting…' :'Book Now'}
      </button>
    </div>
  )
}
