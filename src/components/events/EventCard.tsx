'use client'

import Link from 'next/link'
import type { EventRow } from '@/types/database'

interface Props {
  event:      EventRow
  className?: string
}

export default function EventCard({ event, className }: Props) {
  const spotsLeft = event.capacity - event.tickets_sold
  const isSoldOut = spotsLeft <= 0
  const now = new Date()
  const earlyBirdActive =
    !!event.price_early_bird &&
    event.price_early_bird > 0 &&
    !!event.early_bird_deadline &&
    new Date(event.early_bird_deadline) > now
  const displayPrice = earlyBirdActive ? event.price_early_bird! : event.price
  const isFree       = event.is_free || displayPrice === 0

  const eventDate = new Date(event.date)
  const dayNumber = eventDate.getDate()
  const monthYear = eventDate.toLocaleDateString('en', { month: 'short', year: 'numeric' })

  const hasVipTier = (event.ticket_tiers ?? []).some(t => /vip|table/i.test(t.name))

  return (
    <div className={`event-poster-card${className ? ` ${className}` : ''}`}>
      {/* Poster — CSS background-image fills exact box regardless of source aspect ratio */}
      <Link href={`/events/${event.slug}`} style={{ display: 'block', flexShrink: 0 }}>
        <div
          className="poster-image"
          style={{
            backgroundImage:    event.image_url
              ? `url(${event.image_url})`
              : 'linear-gradient(135deg, #161616, #0A0A0A)',
            backgroundSize:     'cover',
            backgroundPosition: 'center',
            position:           'relative',
          }}
        >
          {isSoldOut && (
            <div style={{
              position:       'absolute',
              inset:          0,
              background:     'rgba(0,0,0,0.75)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <span style={{
                color:         '#fff',
                fontFamily:    'var(--font-jetbrains), monospace',
                fontWeight:    700,
                fontSize:      '18px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Date badge */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
          <span style={{
            fontFamily:          'var(--font-jetbrains), monospace',
            fontWeight:          700,
            fontFeatureSettings: "'tnum'",
            fontSize:            '32px',
            color:               'var(--accent-blue)',
            lineHeight:          1,
          }}>
            {dayNumber}
          </span>
          <span style={{
            fontFamily:    'var(--font-jetbrains), monospace',
            color:         'var(--text-secondary)',
            fontSize:      '12px',
            textTransform: 'uppercase',
            fontWeight:    600,
          }}>
            {monthYear}
          </span>
        </div>

        {/* Title — 2 lines max, Anton distorted at card scale */}
        <Link
          href={`/events/${event.slug}`}
          style={{ textDecoration: 'none', color: '#fff', transition: 'color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-blue)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#fff' }}
        >
          <h3
            className="card-title-distorted"
            style={{
              fontSize:          '17px',
              color:             'inherit',
              margin:            '0 0 8px',
              display:           '-webkit-box',
              WebkitLineClamp:   2,
              WebkitBoxOrient:   'vertical',
              overflow:          'hidden',
            }}
          >
            {event.title}
          </h3>
        </Link>

        {/* Venue */}
        {event.location && (
          <p style={{
            fontFamily:    'var(--font-jetbrains), monospace',
            color:         'var(--text-muted)',
            fontSize:      '11px',
            margin:        '0 0 16px',
            textTransform: 'uppercase',
          }}>
            {event.location}
          </p>
        )}

        {/* Pushes buttons to bottom */}
        <div style={{ flex: 1 }} />

        {/* Primary CTA */}
        <Link
          href={`/events/${event.slug}`}
          style={{
            display:        'block',
            textAlign:      'center',
            background:     'transparent',
            border:         '1px solid var(--border-subtle)',
            color:          '#fff',
            padding:        '11px',
            fontFamily:     'var(--font-jetbrains), monospace',
            fontSize:       '12px',
            fontWeight:     700,
            textTransform:  'uppercase',
            textDecoration: 'none',
            marginBottom:   '4px',
            transition:     'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)'
            e.currentTarget.style.color       = 'var(--accent-blue)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)'
            e.currentTarget.style.color       = '#fff'
          }}
        >
          {isSoldOut ? 'Sold Out' : isFree ? 'Register Free' : 'Tickets Available'}
        </Link>

        {/* VIP / table tier secondary CTA */}
        {!isSoldOut && hasVipTier && (
          <Link
            href={`/events/${event.slug}#vip`}
            style={{
              display:        'block',
              textAlign:      'center',
              color:          'var(--text-muted)',
              padding:        '6px',
              fontFamily:     'var(--font-jetbrains), monospace',
              fontSize:       '11px',
              fontWeight:     600,
              textTransform:  'uppercase',
              textDecoration: 'none',
              transition:     'color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-blue)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Reserve Tables →
          </Link>
        )}
      </div>
    </div>
  )
}
