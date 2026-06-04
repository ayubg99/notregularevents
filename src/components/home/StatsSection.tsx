'use client'

import { useRef, useEffect } from'react'
import { motion, useMotionValue, useTransform, animate, useInView } from'framer-motion'
import { Users, Globe, Calendar, MapPin } from'lucide-react'
import type { ElementType } from'react'

interface StatItem {
  end: number
  suffix: string
  label: string
  desc: string
  icon: ElementType
}

const STATS: StatItem[] = [
  { end: 5000, suffix:'+', label:'Students', desc:'Across 50+ nationalities', icon: Users },
  { end: 50, suffix:'+', label:'Nationalities', desc:'All in one community', icon: Globe },
  { end: 6, suffix:'', label:'Events/Week', desc:'Parties, culture & more', icon: Calendar },
  { end: 1994, suffix:'', label:'Est.', desc:'The official Erasmus community', icon: MapPin },
]

function StatCard({ item }: { item: StatItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const count = useMotionValue(0)
  const display = useTransform(count, (v) => Math.round(v).toLocaleString())
  const inView = useInView(ref, { once: true, margin:'-80px' })
  const Icon = item.icon

  useEffect(() => {
    if (inView) {
      const controls = animate(count, item.end, { duration: 2.2, ease:'easeOut' })
      return controls.stop
    }
  }, [inView, count, item.end])

  return (
    <div
      ref={ref}
      className="glass-card card-hover rounded-2xl p-8 text-center"
    >
      {/* Icon */}
      <div className="mx-auto mb-4 w-11 h-11 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
        <Icon size={20} className="text-brand-primary" />
      </div>

      {/* Animated number */}
      <div className="font-heading text-5xl font-bold flex items-baseline justify-center gap-0.5">
        <motion.span className="text-gradient">{display}</motion.span>
        <span className="text-gradient">{item.suffix}</span>
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
