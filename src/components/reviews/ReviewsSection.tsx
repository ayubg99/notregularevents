'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReviewForm } from './ReviewForm'
import { NATIONALITIES } from '@/lib/constants/nationalities'
import { cn } from '@/lib/utils/cn'
import type { TestimonialRow } from '@/types/database'

function getFlag(nationalityValue: string) {
  const entry = NATIONALITIES.find(n => n.value === nationalityValue)
  if (!entry) return ''
  return entry.label.split(' ')[0]
}

export default function ReviewsSection() {
  const t = useTranslations('reviews')
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([])
  const [current,      setCurrent]      = useState(0)
  const [isHovered,    setIsHovered]    = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('testimonials')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setTestimonials(data ?? [])
        setLoading(false)
      })
  }, [])

  const total  = testimonials.length
  const goNext = useCallback(() => setCurrent(c => (c + 1) % total), [total])
  const goPrev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total])

  useEffect(() => {
    if (isHovered || showForm || total === 0) return
    const timer = setInterval(goNext, 4000)
    return () => clearInterval(timer)
  }, [isHovered, showForm, goNext, total])

  function handleSubmitted(newTestimonial: TestimonialRow) {
    setTestimonials(prev => [newTestimonial, ...prev])
    setCurrent(0)
    setShowForm(false)
  }

  const testimonial = testimonials[current]

  return (
    <section className="py-20 bg-brand-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-2">
            {t('label')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white">
            {t('sectionTitle')}
          </h2>
        </div>

        {/* Carousel */}
        {!loading && total > 0 && testimonial && (
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, x: 40,  scale: 0.97 }}
                animate={{ opacity: 1, x: 0,   scale: 1    }}
                exit={{    opacity: 0, x: -40, scale: 0.97 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="glass-card glow-primary rounded-3xl p-8 md:p-12 text-center"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={20} className="text-brand-primary fill-brand-primary" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="font-heading text-2xl md:text-3xl text-white/85 leading-snug italic mb-8">
                  &ldquo;{testimonial.review_text}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-[#1a3acc] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {testimonial.first_name[0]}{testimonial.last_name[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">
                      {testimonial.first_name} {testimonial.last_name}{' '}
                      <span>{getFlag(testimonial.nationality)}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {total > 1 && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Previous review"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full glass border border-white/20 items-center justify-center text-white/60 hover:text-brand-primary transition-colors hidden sm:flex"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next review"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full glass border border-white/20 items-center justify-center text-white/60 hover:text-brand-primary transition-colors hidden sm:flex"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && total === 0 && (
          <p className="text-center text-white/40 text-sm mb-2">{t('noReviewsYet')}</p>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to review ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === current ? 'w-8 bg-brand-primary' : 'w-2 bg-white/20',
                )}
              />
            ))}
          </div>
        )}

        {/* Write a review CTA */}
        {!showForm && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-full border border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary hover:text-white transition-all duration-200"
            >
              {t('writeReview')}
            </button>
          </div>
        )}

        {/* Review form */}
        {showForm && (
          <div className="mt-8 max-w-lg mx-auto">
            <ReviewForm onSubmitted={handleSubmitted} />
          </div>
        )}

      </div>
    </section>
  )
}
