'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronDown } from 'lucide-react'

export default function HeroSection() {
  const [videoError, setVideoError] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark">

      {/* ── Video / gradient background ─────────────────────── */}
      <div className="absolute inset-0 z-0">
        {!videoError && (
          <video
            autoPlay
            muted
            loop
            playsInline
            src="/videos/hero.mp4"
            poster="/videos/hero-poster.jpg"
            className="w-full h-full object-cover opacity-40"
            onError={() => setVideoError(true)}
          />
        )}
        {/* Dark gradient overlay — always visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/60 via-brand-dark/30 to-brand-dark/85" />
      </div>

      {/* ── Decorative blur orbs ─────────────────────────────── */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 rounded-full bg-brand-primary/15 blur-3xl pointer-events-none z-10" />
      <div className="absolute bottom-1/3 right-1/6 w-80 h-80 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none z-10" />

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/20 text-white/80 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse flex-shrink-0" />
            Valencia&apos;s #1 Erasmus Community
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Live the{' '}
          <span className="text-gradient">Erasmus</span>
          <br />
          Experience
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
        >
          Events, trips &amp; unforgettable memories in Valencia.
          Join 2,500+ students from 50+ countries.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        >
          <Link
            href="/events"
            className="flex items-center gap-2 px-8 py-4 bg-brand-primary hover:brightness-110 active:brightness-90 text-white font-semibold text-base rounded-full shadow-brand-md hover:shadow-brand-lg hover:-translate-y-px transition-all duration-200 w-full sm:w-auto justify-center"
          >
            Explore Events
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>
          <Link
            href="/trips"
            className="flex items-center gap-2 px-8 py-4 glass border border-white/20 hover:bg-white/15 text-white font-semibold text-base rounded-full transition-all duration-200 w-full sm:w-auto justify-center"
          >
            Explore Trips
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>

      {/* ── Animated scroll indicator ─────────────────────────── */}
      <motion.button
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-200 cursor-pointer"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
        aria-label="Scroll to content"
      >
        <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
        <ChevronDown size={20} />
      </motion.button>

    </section>
  )
}
