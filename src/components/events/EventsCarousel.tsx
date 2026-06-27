'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { EventRow } from '@/types/database'
import EventCard from '@/components/events/EventCard'

export function EventsCarousel({ events }: { events: EventRow[] }) {
  const t        = useTranslations('events')
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: direction === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  return (
    <div>
      <div
        ref={scrollRef}
        className="events-carousel"
        style={{
          display:        'flex',
          gap:            '16px',
          overflowX:      'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          paddingBottom:  '4px',
        }}
      >
        {events.map(event => (
          <div key={event.id} style={{ scrollSnapAlign: 'start' }}>
            <EventCard event={event} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <Link
          href="/events"
          style={{
            display:        'inline-block',
            background:     'var(--accent-blue)',
            color:          '#fff',
            padding:        '12px 24px',
            fontFamily:     "'JetBrains Mono', monospace",
            fontWeight:     700,
            fontSize:       '13px',
            textTransform:  'uppercase',
            textDecoration: 'none',
            borderRadius:   '4px',
          }}
        >
          {t('seeMore')} →
        </Link>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => scroll('left')} aria-label="Previous" style={{ width:'40px', height:'40px', borderRadius:'50%', border:'1px solid var(--border-subtle)', background:'transparent', color:'#fff', cursor:'pointer', fontSize:'16px' }}>←</button>
          <button onClick={() => scroll('right')} aria-label="Next" style={{ width:'40px', height:'40px', borderRadius:'50%', border:'1px solid var(--border-subtle)', background:'transparent', color:'#fff', cursor:'pointer', fontSize:'16px' }}>→</button>
        </div>
      </div>
    </div>
  )
}
