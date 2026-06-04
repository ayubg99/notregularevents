'use client'

import { useState } from'react'
import Link from'next/link'
import { motion } from'framer-motion'
import { ChevronRight, ChevronDown } from'lucide-react'

const VIBE_PILLS = [
  { emoji:'', text:'5,000+ students', delay: 0, pos:'top-[22%] left-[7%]' },
  { emoji:'', text:'Weekend trips', delay: 0.6, pos:'top-[18%] right-[9%]' },
  { emoji:'', text:'50+ nationalities', delay: 1.2, pos:'bottom-[32%] left-[5%]' },
  { emoji:'', text:'Active community', delay: 1.8, pos:'bottom-[28%] right-[7%]' },
]

export default function HeroSection() {
  const [videoError, setVideoError] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark">

      {/* Video / gradient background */}
      <div className="absolute inset-0 z-0">
        {!videoError && (
          <video
            autoPlay
            muted
            loop
            playsInline
            src="/videos/hero.mp4"
            poster="/videos/hero-poster.jpg"
            className="w-full h-full object-cover opacity-35"
            onError={() => setVideoError(true)}
          />
        )}
        {/* Layered gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/70 via-brand-dark/25 to-brand-dark/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,107,0,0.13),transparent)]" />
      </div>

      {/* Decorative blur orbs */}
      <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none z-10" />
      <div className="absolute bottom-1/3 right-1/6 w-[400px] h-[400px] rounded-full bg-brand-accent/8 blur-[100px] pointer-events-none z-10" />

      {/* Palm tree silhouettes (desktop only) */}
      <motion.div
        className="absolute bottom-0 left-0 w-44 h-[340px] pointer-events-none z-10 hidden lg:block"
        animate={{ rotate: [0, 0.6, -0.3, 0], y: [0, -5, -2, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease:'easeInOut' }}
        style={{ transformOrigin:'bottom center', opacity: 0.07 }}
      >
        <svg viewBox="0 0 100 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M54 200 C52 168 49 138 51 108 C53 88 59 70 62 54" stroke="#FF6B00" strokeWidth="7" strokeLinecap="round"/>
          <path d="M62 54 C42 34 18 40 4 30" stroke="#FF6B00" strokeWidth="5" strokeLinecap="round"/>
          <path d="M62 54 C84 34 100 38 112 28" stroke="#FF6B00" strokeWidth="5" strokeLinecap="round"/>
          <path d="M62 54 C38 46 16 60 8 76" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
          <path d="M62 54 C86 46 104 58 114 72" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
          <path d="M62 54 C54 36 48 20 44 8" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
          <path d="M62 54 C70 36 76 20 80 8" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-0 w-52 h-[400px] pointer-events-none z-10 hidden lg:block"
        animate={{ rotate: [0, -0.7, 0.4, 0], y: [0, -6, -3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease:'easeInOut', delay: 1.5 }}
        style={{ transformOrigin:'bottom center', opacity: 0.07 }}
      >
        <svg viewBox="0 0 100 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 200 C46 165 50 132 48 102 C46 82 40 64 38 48" stroke="#FF6B00" strokeWidth="7" strokeLinecap="round"/>
          <path d="M38 48 C58 28 82 34 96 24" stroke="#FF6B00" strokeWidth="5" strokeLinecap="round"/>
          <path d="M38 48 C16 28 0 32 -12 22" stroke="#FF6B00" strokeWidth="5" strokeLinecap="round"/>
          <path d="M38 48 C62 40 84 54 92 70" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
          <path d="M38 48 C14 40 -4 52 -14 66" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
          <path d="M38 48 C46 30 52 14 56 2" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
          <path d="M38 48 C30 30 24 14 20 2" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </motion.div>

      {/* Floating vibe pills (desktop only) */}
      {VIBE_PILLS.map((pill) => (
        <motion.div
          key={pill.text}
          className={`absolute ${pill.pos} z-20 hidden lg:flex items-center gap-2 px-4 py-2.5 glass rounded-full text-sm font-medium text-white/90`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: pill.delay + 0.8 },
            scale: { duration: 0.5, delay: pill.delay + 0.8 },
            y: { duration: 3 + pill.delay * 0.3, repeat: Infinity, ease:'easeInOut', delay: pill.delay },
          }}
        >
          <span>{pill.emoji}</span>
          <span>{pill.text}</span>
        </motion.div>
      ))}

      {/* Main content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease:'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/20 text-white/80 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse flex-shrink-0" />
            The Official Erasmus Community in Valencia
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white leading-[0.9] tracking-tight"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Your Erasmus{''}
          <span className="text-gradient">in Valencia</span>
          <br />
          Starts Here 
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-8 text-lg sm:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease:'easeOut' }}
        >
          The official platform for Erasmus students in Valencia.
          Events, trips, parties and everything you need for the best semester of your life.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease:'easeOut' }}
        >
          <Link
            href="/events"
            className="flex items-center gap-2 px-8 py-4 btn-primary text-base w-full sm:w-auto justify-center"
          >
            Explore Events
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>
          <Link
            href="/membership"
            className="flex items-center gap-2 px-8 py-4 btn-secondary text-base w-full sm:w-auto justify-center"
          >
            Join Membership
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>

      {/* Animated scroll indicator */}
      <motion.button
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-200 cursor-pointer"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease:'easeInOut' }}
        onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior:'smooth' })}
        aria-label="Scroll to content"
      >
        <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
        <ChevronDown size={20} />
      </motion.button>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-brand-dark to-transparent pointer-events-none z-10" />

    </section>
  )
}
