'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Testimonial {
  id:         number
  name:       string
  country:    string
  flag:       string
  university: string
  text:       string
  rating:     number
  avatar:     string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id:         1,
    name:       'Sofia Müller',
    country:    'Germany',
    flag:       '🇩🇪',
    university: 'TU Munich',
    text:       'Erasmus Vibe completely transformed my time in Valencia. The events were incredible and I made friends for life. Absolutely worth every euro!',
    rating:     5,
    avatar:     'SM',
  },
  {
    id:         2,
    name:       'Marco Rossi',
    country:    'Italy',
    flag:       '🇮🇹',
    university: 'Bocconi University',
    text:       "The trips to Barcelona and Ibiza were mind-blowing. The team is super professional and the community is the best I've ever been part of.",
    rating:     5,
    avatar:     'MR',
  },
  {
    id:         3,
    name:       'Ana Kowalski',
    country:    'Poland',
    flag:       '🇵🇱',
    university: 'Warsaw School of Economics',
    text:       'I was nervous about moving to Valencia alone, but from day one Erasmus Vibe made me feel at home. The WhatsApp group alone is a lifeline!',
    rating:     5,
    avatar:     'AK',
  },
  {
    id:         4,
    name:       "Liam O'Brien",
    country:    'Ireland',
    flag:       '🇮🇪',
    university: 'Trinity College Dublin',
    text:       'Best decision of my life was joining this community. The pool parties alone are worth coming to Valencia for. 10/10, no hesitation.',
    rating:     5,
    avatar:     'LO',
  },
]

export default function TestimonialsSection() {
  const [current,   setCurrent]   = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const total = TESTIMONIALS.length

  const goNext = useCallback(() => setCurrent((c) => (c + 1) % total), [total])
  const goPrev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total])

  // Auto-advance; pause on hover
  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(goNext, 4000)
    return () => clearInterval(timer)
  }, [isHovered, goNext])

  const testimonial = TESTIMONIALS[current]

  return (
    <section className="py-20 bg-brand-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-widest mb-2">
            What Our Community Says
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">
            Real Experiences
          </h2>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0  }}
              exit={{    opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="glass-card rounded-2xl p-8 md:p-12 text-center"
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-lg md:text-xl text-white/85 leading-relaxed italic mb-8">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {testimonial.avatar}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">
                    {testimonial.name} <span>{testimonial.flag}</span>
                  </p>
                  <p className="text-sm text-white/50">
                    {testimonial.university} · {testimonial.country}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next buttons */}
          <button
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full glass border border-white/20 items-center justify-center text-white/60 hover:text-brand-primary transition-colors hidden sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full glass border border-white/20 items-center justify-center text-white/60 hover:text-brand-primary transition-colors hidden sm:flex"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === current ? 'w-8 bg-brand-primary' : 'w-2 bg-white/20',
              )}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
