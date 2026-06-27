'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NATIONALITIES } from '@/lib/constants/nationalities'
import { cn } from '@/lib/utils/cn'
import type { TestimonialRow } from '@/types/database'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors'

export function ReviewForm({ onSubmitted }: { onSubmitted: (r: TestimonialRow) => void }) {
  const t = useTranslations('reviews')
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [email,       setEmail]       = useState('')
  const [nationality, setNationality] = useState('')
  const [rating,      setRating]      = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText,  setReviewText]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!firstName || !lastName || !email || !nationality || !reviewText) {
      setError(t('errorRequired'))
      return
    }
    if (rating === 0) {
      setError(t('errorRating'))
      return
    }
    if (reviewText.trim().length < 10) {
      setError(t('errorTooShort'))
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: insertError } = await supabase
      .from('testimonials')
      .insert({
        user_id:     user?.id ?? null,
        first_name:  firstName.trim(),
        last_name:   lastName.trim(),
        email:       email.trim(),
        nationality,
        rating,
        review_text: reviewText.trim(),
      })
      .select()
      .single()

    setSubmitting(false)

    if (insertError || !data) {
      console.error('[ReviewForm]', insertError?.message)
      setError(t('errorGeneric'))
      return
    }

    setFirstName('')
    setLastName('')
    setEmail('')
    setNationality('')
    setRating(0)
    setReviewText('')

    onSubmitted(data as TestimonialRow)
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <h3 className="font-heading text-xl font-bold text-white mb-1">{t('formTitle')}</h3>
          <p className="text-white/50 text-sm">{t('formSubtitle')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder={t('firstName')}
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder={t('lastName')}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className={inputClass}
          />
        </div>

        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
        />

        <select
          value={nationality}
          onChange={e => setNationality(e.target.value)}
          className={cn(inputClass, 'cursor-pointer')}
        >
          <option value="" disabled className="bg-[#1A1A2E] text-white/50">
            {t('selectNationality')}
          </option>
          {NATIONALITIES.map(n => (
            <option key={n.value} value={n.value} className="bg-[#1A1A2E] text-white">
              {n.label}
            </option>
          ))}
        </select>

        <div>
          <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">{t('ratingLabel')}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  size={22}
                  className={cn(
                    'transition-colors',
                    star <= (hoverRating || rating)
                      ? 'text-brand-primary fill-brand-primary'
                      : 'text-white/20 fill-transparent',
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder={t('reviewPlaceholder')}
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          rows={4}
          maxLength={1000}
          className={cn(inputClass, 'resize-vertical')}
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-full bg-brand-primary hover:brightness-110 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-70"
        >
          {submitting ? t('submitting') : t('submitButton')}
        </button>
      </form>
    </div>
  )
}
