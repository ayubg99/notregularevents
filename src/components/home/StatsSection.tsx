'use client'

import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'

interface StatItem {
  end:    number
  suffix: string
  label:  string
  desc:   string
}

const STATS: StatItem[] = [
  { end: 500, suffix: '+', label: 'Members',        desc: 'From 50+ countries'       },
  { end: 20,  suffix: '+', label: 'Nationalities',  desc: 'All in one community'     },
  { end: 100, suffix: '+', label: 'Events Hosted',  desc: 'Parties, culture & more'  },
  { end: 48,  suffix: '+', label: 'Trips Completed',desc: 'Across Europe & beyond'   },
]

function StatCard({ item }: { item: StatItem }) {
  const ref     = useRef<HTMLDivElement>(null)
  const count   = useMotionValue(0)
  const display = useTransform(count, (v) => Math.round(v).toLocaleString())
  const inView  = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (inView) {
      const controls = animate(count, item.end, { duration: 2.2, ease: 'easeOut' })
      return controls.stop
    }
  }, [inView, count, item.end])

  return (
    <div
      ref={ref}
      className="glass-card rounded-2xl p-8 text-center group hover:shadow-glow-teal transition-all duration-300"
    >
      {/* Animated number */}
      <div className="font-heading text-5xl font-bold text-white flex items-baseline justify-center gap-0.5">
        <motion.span>{display}</motion.span>
        <span className="text-brand-primary">{item.suffix}</span>
      </div>

      <p className="mt-2 text-base font-semibold text-white/90">{item.label}</p>
      <p className="mt-1 text-sm text-white/50">{item.desc}</p>
    </div>
  )
}

export default function StatsSection() {
  return (
    <section id="stats" className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
