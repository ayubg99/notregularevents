'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Star, LogIn } from 'lucide-react'
import { addReview } from '@/app/actions/reviews'
import type { ReviewRow } from '@/types/database'
import { cn } from '@/lib/utils/cn'

// ─── Star picker / display ──────────────────────────────────────

function StarRow({
  value,
  onChange,
}: {
  value:     number
  onChange?: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const interactive = !!onChange

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          disabled={!interactive}
          className={cn('p-0.5 transition-transform', interactive && 'hover:scale-110 cursor-pointer')}
        >
          <Star
            size={interactive ? 20 : 15}
            className={cn(
              'transition-colors',
              (hovered || value) >= i
                ? 'text-brand-primary fill-brand-primary'
                : 'text-white/20 fill-transparent',
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Props ──────────────────────────────────────────────────────

interface Props {
  targetId:        string
  targetType:      'event' | 'trip'
  initialReviews:  ReviewRow[]
  isAuthenticated: boolean
}

// ─── Component ──────────────────────────────────────────────────

export default function ReviewsSection({ targetId, targetType, initialReviews, isAuthenticated }: Props) {
  const router                        = useRouter()
  const [rating,  setRating]          = useState(0)
  const [comment, setComment]         = useState('')
  const [formError,   setFormError]   = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [isPending, startTransition]  = useTransition()

  const avgRating = initialReviews.length
    ? initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length
    : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setFormError('Please select a star rating.'); return }
    setFormError('')

    startTransition(async () => {
      const result = await addReview({
        targetId,
        targetType,
        rating,
        comment,
      })
      if (result.success) {
        setSubmitted(true)
        router.refresh() // re-fetch server data → updated review list
      } else {
        setFormError(result.error)
      }
    })
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="font-heading text-2xl font-bold text-white">Reviews</h2>
        {initialReviews.length > 0 && (
          <span className="text-white/40 text-sm">
            {avgRating.toFixed(1)} avg · {initialReviews.length} review{initialReviews.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Review list */}
      {initialReviews.length === 0 ? (
        <p className="text-white/40 text-sm mb-8">No reviews yet. Be the first to share your experience!</p>
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          {initialReviews.map(review => (
            <div key={review.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Student</p>
                  <p className="text-white/35 text-xs">
                    {new Date(review.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
                    })}
                  </p>
                </div>
                <StarRow value={review.rating} />
              </div>
              {review.comment && (
                <p className="text-white/65 text-sm leading-relaxed pl-11">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review form */}
      {!isAuthenticated ? (
        <div className="glass-card rounded-xl p-5 flex items-center gap-3">
          <LogIn size={18} className="text-white/40 flex-shrink-0" />
          <p className="text-white/60 text-sm">
            <Link href="/auth/login" className="text-brand-primary hover:underline font-medium">Log in</Link>
            {' '}to leave a review.
          </p>
        </div>
      ) : submitted ? (
        <div className="glass-card rounded-xl p-5 text-center">
          <p className="text-brand-success font-semibold">Thanks for your review! 🎉</p>
          <p className="text-white/50 text-sm mt-1">It will appear above after the page refreshes.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-white font-semibold">Leave a Review</h3>

          <div>
            <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">Your rating</p>
            <StarRow value={rating} onChange={setRating} />
          </div>

          <div>
            <label htmlFor="review-comment" className="text-white/50 text-xs mb-2 uppercase tracking-wide block">
              Comment <span className="normal-case">(optional)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Share your experience…"
              className="
                w-full px-4 py-3 rounded-xl text-sm resize-none
                border border-[var(--border-clr)] bg-[var(--bg-card)]
                text-[var(--text-base)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-brand-primary/60
                transition-all duration-200
              "
            />
          </div>

          {formError && <p className="text-red-400 text-sm">{formError}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-full bg-brand-primary hover:brightness-110 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-70 self-start"
          >
            {isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}
    </section>
  )
}
