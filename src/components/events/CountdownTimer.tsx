'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'

interface Props { targetDate: string }
interface Remaining { days: number; hours: number; minutes: number; seconds: number }

function calc(target: string): Remaining | null {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000)    % 60),
    seconds: Math.floor((diff / 1_000)     % 60),
  }
}

const subscribe = () => () => {}

export default function CountdownTimer({ targetDate }: Props) {
  const t         = useTranslations('events')
  const isMounted = useSyncExternalStore(subscribe, () => true, () => false)
  const [remaining, setRemaining] = useState<Remaining | null>(() =>
    typeof window !== 'undefined' ? calc(targetDate) : null
  )

  useEffect(() => {
    const id = setInterval(() => setRemaining(calc(targetDate)), 1_000)
    return () => clearInterval(id)
  }, [targetDate])

  const labels = [t('days'), t('hours'), t('mins'), t('secs')]

  if (!isMounted) {
    return (
      <div className="flex gap-2 flex-wrap">
        {labels.map((label) => (
          <div key={label} className="flex flex-col items-center glass-card rounded-xl px-3.5 py-2.5 min-w-[58px]">
            <span className="font-heading text-2xl font-bold text-white tabular-nums leading-none">--</span>
            <span className="text-white/45 text-[10px] uppercase tracking-widest mt-1">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  if (!remaining) {
    return (
      <p className="text-brand-accent font-semibold text-sm animate-pulse">
        {t('started')}
      </p>
    )
  }

  const units = [
    { label: t('days'),  value: remaining.days    },
    { label: t('hours'), value: remaining.hours   },
    { label: t('mins'),  value: remaining.minutes },
    { label: t('secs'),  value: remaining.seconds },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center glass-card rounded-xl px-3.5 py-2.5 min-w-[58px]">
          <span className="font-heading text-2xl font-bold text-white tabular-nums leading-none">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-white/45 text-[10px] uppercase tracking-widest mt-1">{label}</span>
        </div>
      ))}
    </div>
  )
}
