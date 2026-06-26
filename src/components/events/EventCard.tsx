import Link from 'next/link'
import Image from 'next/image'
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

  const eventDate  = new Date(event.date)
  const dayNumber  = eventDate.getDate()
  const monthYear  = eventDate.toLocaleDateString('en', { month: 'short', year: 'numeric' })

  const hasVipTier = (event.ticket_tiers ?? []).some(t => /vip|table/i.test(t.name))

  return (
    <div
      className={className}
      style={{
        background:     'var(--bg-card)',
        border:         '1px solid var(--border-subtle)',
        overflow:       'hidden',
        display:        'flex',
        flexDirection:  'column',
      }}
    >
      {/* Poster image — clean, no overlays */}
      <Link
        href={`/events/${event.slug}`}
        style={{ display: 'block', height: '300px', position: 'relative', flexShrink: 0 }}
      >
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,91,255,0.15)' }} />
        )}
        {isSoldOut && (
          <div style={{
            position:        'absolute',
            inset:           0,
            background:      'rgba(0,0,0,0.75)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
          }}>
            <span style={{
              color:          '#fff',
              fontFamily:     "'JetBrains Mono', monospace",
              fontWeight:     700,
              fontSize:       '18px',
              letterSpacing:  '0.1em',
              textTransform:  'uppercase',
            }}>
              Sold Out
            </span>
          </div>
        )}
      </Link>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Date badge */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
          <span style={{
            fontFamily:         "'JetBrains Mono', monospace",
            fontWeight:         700,
            fontFeatureSettings: "'tnum'",
            fontSize:           '32px',
            color:              'var(--accent-blue)',
            lineHeight:         1,
          }}>
            {dayNumber}
          </span>
          <span style={{
            fontFamily:     "'JetBrains Mono', monospace",
            color:          'var(--text-secondary)',
            fontSize:       '12px',
            textTransform:  'uppercase',
            fontWeight:     600,
          }}>
            {monthYear}
          </span>
        </div>

        {/* Title — 2 lines max */}
        <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none' }}>
          <h3
            className="line-clamp-2"
            style={{
              fontFamily:  "'JetBrains Mono', monospace",
              fontWeight:  700,
              fontSize:    '15px',
              color:       '#fff',
              margin:      '0 0 8px',
              lineHeight:  1.3,
            }}
          >
            {event.title}
          </h3>
        </Link>

        {/* Venue line */}
        {event.location && (
          <p style={{
            fontFamily:     "'JetBrains Mono', monospace",
            color:          'var(--text-muted)',
            fontSize:       '11px',
            margin:         '0 0 16px',
            textTransform:  'uppercase',
          }}>
            {event.location}
          </p>
        )}

        {/* Pushes buttons to bottom so all cards in a row align */}
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
            fontFamily:     "'JetBrains Mono', monospace",
            fontSize:       '12px',
            fontWeight:     700,
            textTransform:  'uppercase',
            textDecoration: 'none',
            marginBottom:   '4px',
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
              fontFamily:     "'JetBrains Mono', monospace",
              fontSize:       '11px',
              fontWeight:     600,
              textTransform:  'uppercase',
              textDecoration: 'none',
            }}
          >
            Reserve Tables →
          </Link>
        )}
      </div>
    </div>
  )
}
