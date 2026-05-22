'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import type { MembershipPlan } from '@/types/database'

interface PlanDef {
  id:       MembershipPlan
  name:     string
  price:    number
  period:   string
  badge:    string | null
  saving:   string | null
  perMonth: string
  perks:    string[]
  featured: boolean
}

const PLANS: PlanDef[] = [
  {
    id:       'basic',
    name:     'Monthly',
    price:    9.99,
    period:   'month',
    badge:    null,
    saving:   null,
    perMonth: '€9.99/mo',
    perks:    [
      'Priority event access',
      'Discounted trips',
      'Members-only parties',
      'Student partner discounts',
    ],
    featured: false,
  },
  {
    id:       'premium',
    name:     'Semester',
    price:    24.99,
    period:   '6 months',
    badge:    'Most Popular',
    saving:   'Save 17%',
    perMonth: '≈€4.17/mo',
    perks:    [
      'Everything in Monthly',
      'Private WhatsApp groups',
      'VIP treatment at events',
      'Early trip booking window',
    ],
    featured: true,
  },
  {
    id:       'vip',
    name:     'Annual',
    price:    39.99,
    period:   'year',
    badge:    'Best Value',
    saving:   'Save 67%',
    perMonth: '≈€3.33/mo',
    perks:    [
      'Everything in Semester',
      'Exclusive yearly events',
      'Top-tier priority access',
      'Free guest pass (1×/year)',
    ],
    featured: false,
  },
]

interface Props {
  currentPlan: MembershipPlan | null
}

export default function PricingCards({ currentPlan }: Props) {
  const router = useRouter()
  const [pendingId, setPendingId]   = useState<MembershipPlan | null>(null)
  const [error,     setError]       = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubscribe(planId: MembershipPlan) {
    setError('')
    setPendingId(planId)
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/create-checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ type: 'membership', itemId: planId }),
        })
        let data: { url?: string; error?: string }
        try {
          data = await res.json()
        } catch {
          setError(`Server error (${res.status}). Please try again.`)
          setPendingId(null)
          return
        }
        if (data.url) {
          router.push(data.url)
        } else {
          setError(data.error ?? 'Something went wrong. Please try again.')
          setPendingId(null)
        }
      } catch {
        setError('Could not reach the server. Check your connection and try again.')
        setPendingId(null)
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {PLANS.map((plan) => {
          const isCurrent  = currentPlan === plan.id
          const isLoading  = isPending && pendingId === plan.id
          const anyLoading = isPending

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 card-hover ${
                plan.featured
                  ? 'border-brand-primary/50 bg-brand-primary/8 glow-primary scale-[1.03]'
                  : isCurrent
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                  plan.featured
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {plan.badge}
                </span>
              )}

              {/* Plan name + price */}
              <div className="mb-5">
                <h3 className="font-heading text-xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-end gap-2">
                  <span className={`font-heading text-4xl font-bold ${plan.featured ? 'text-gradient-primary' : 'text-white'}`}>€{plan.price}</span>
                  <span className="text-white/40 text-sm pb-1">/ {plan.period}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-white/40 text-xs">{plan.perMonth}</span>
                  {plan.saving && (
                    <span className="text-green-400 text-xs font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      {plan.saving}
                    </span>
                  )}
                </div>
              </div>

              {/* Perks */}
              <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check size={14} className={`flex-shrink-0 mt-0.5 ${plan.featured ? 'text-brand-primary' : 'text-white/40'}`} />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {isCurrent ? (
                <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-green-500/15 border border-green-500/30 text-green-400">
                  Current Plan ✓
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={anyLoading}
                  className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 ${
                    plan.featured
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {isLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
                  ) : (
                    `Get ${plan.name}`
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  )
}
