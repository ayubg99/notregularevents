'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
      'Free entry to exclusive member events',
      '10% off every event ticket',
      'Free housing contact reveals',
      'Member card & dashboard access',
      'Weekly newsletter with exclusive deals',
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
      'Partner promo codes & discounts',
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
      'Free guest pass (1× per year)',
      'Ambassador program eligibility',
      'Exclusive yearly member events',
    ],
    featured: false,
  },
]


interface Props {
  currentPlan: MembershipPlan | null
  isLoggedIn:  boolean
}

export default function PricingCards({ currentPlan, isLoggedIn }: Props) {
  const router = useRouter()
  const [pendingId,      setPendingId]      = useState<MembershipPlan | null>(null)
  const [error,          setError]          = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubscribe(planId: MembershipPlan) {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
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
          const isUpgrade  = !!currentPlan && !isCurrent
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
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
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
              {isUpgrade && (
                <div style={{
                  background:    'rgba(255,107,0,0.1)',
                  border:        '1px solid rgba(255,107,0,0.4)',
                  borderRadius:  '10px',
                  padding:       '10px 12px',
                  marginBottom:  '12px',
                  textAlign:     'center',
                }}>
                  <p style={{ color: '#FF6B00', margin: 0, fontSize: '12px', lineHeight: 1.4 }}>
                    Upgrading will cancel your current <strong>{currentPlan}</strong> plan.
                  </p>
                </div>
              )}
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
                  ) : isUpgrade ? (
                    `Upgrade to ${plan.name} →`
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

      {showLoginModal && (
        <div
          onClick={() => setShowLoginModal(false)}
          style={{
            position:        'fixed',
            inset:           0,
            background:      'rgba(0,0,0,0.85)',
            backdropFilter:  'blur(8px)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            zIndex:          1000,
            padding:         '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position:     'relative',
              background:   'linear-gradient(145deg, #1A0A14, #0D0D0D)',
              border:       '1px solid rgba(255,107,0,0.25)',
              borderRadius: '24px',
              padding:      '48px 40px',
              maxWidth:     '420px',
              width:        '100%',
              textAlign:    'center',
              boxShadow:    '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,107,0,0.05)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position:       'absolute',
                top:            '16px',
                right:          '16px',
                background:     'rgba(255,255,255,0.05)',
                border:         '1px solid rgba(255,255,255,0.1)',
                borderRadius:   '50%',
                width:          '32px',
                height:         '32px',
                color:          '#888',
                fontSize:       '16px',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {/* Icon */}
            <div style={{
              width:          '64px',
              height:         '64px',
              borderRadius:   '50%',
              background:     'linear-gradient(135deg, #FF6B00, #E91E8C)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 20px',
              fontSize:       '28px',
              boxShadow:      '0 8px 24px rgba(255,107,0,0.3)',
            }}>
              👑
            </div>

            {/* Title */}
            <h2 style={{
              color:          '#fff',
              fontSize:       '24px',
              fontWeight:     700,
              margin:         '0 0 8px',
              letterSpacing:  '-0.5px',
            }}>
              Unlock Your Membership
            </h2>

            {/* Subtitle */}
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px', lineHeight: 1.6 }}>
              Create a free account to get started with exclusive Not Regular Events benefits
            </p>

            {/* CTA buttons */}
            <Link
              href="/auth/register?redirect=/membership"
              style={{
                display:        'block',
                background:     'linear-gradient(135deg, #FF6B00, #E91E8C)',
                color:          '#FFFFFF',
                padding:        '16px',
                borderRadius:   '8px',
                textDecoration: 'none',
                fontWeight:     800,
                fontSize:       '15px',
                marginBottom:   '10px',
                boxShadow:      '0 8px 24px rgba(255,107,0,0.35)',
                textAlign:      'center',
                letterSpacing:  '0.3px',
              }}
            >
              Create Free Account →
            </Link>

            <Link
              href="/auth/login?redirect=/membership"
              style={{
                display:        'block',
                background:     'transparent',
                color:          '#fff',
                padding:        '15px',
                borderRadius:   '50px',
                textDecoration: 'none',
                fontWeight:     600,
                fontSize:       '14px',
                border:         '1px solid rgba(255,255,255,0.15)',
                textAlign:      'center',
                letterSpacing:  '0.3px',
              }}
            >
              Already have an account? Login
            </Link>

            <p style={{ color: 'rgba(255,107,0,0.4)', fontSize: '12px', marginTop: '20px' }}>
              Free to join • Cancel anytime
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
