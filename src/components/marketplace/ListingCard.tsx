'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CATEGORIES, CONDITIONS } from '@/lib/marketplace'
import type { MarketplaceListingRow } from '@/types/database'

interface Props {
  listing: MarketplaceListingRow
}

export default function ListingCard({ listing }: Props) {
  const [hovered, setHovered] = useState(false)

  const cat       = CATEGORIES.find(c => c.id === listing.category)
  const condition = CONDITIONS.find(c => c.id === listing.condition)

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      style={{
        display:        'block',
        background:     'rgba(255,255,255,0.03)',
        border:         hovered ? '1px solid rgba(78,205,196,0.3)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius:   '16px',
        overflow:       'hidden',
        textDecoration: 'none',
        transform:      hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition:     'transform 0.2s, border 0.2s',
        cursor:         'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo */}
      <div style={{
        height:   '200px',
        position: 'relative',
        background: 'linear-gradient(135deg, #4ECDC4, #2ECC71)',
      }}>
        {listing.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            height:          '100%',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '56px',
          }}>
            {cat?.emoji ?? '📦'}
          </div>
        )}

        {/* Condition badge */}
        <span style={{
          position:       'absolute',
          top:            '10px',
          left:           '10px',
          background:     'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          color:          condition?.color ?? '#fff',
          padding:        '3px 10px',
          borderRadius:   '20px',
          fontSize:       '11px',
          fontWeight:     600,
        }}>
          {condition?.label}
        </span>

        {/* FREE badge */}
        {listing.is_free && (
          <span style={{
            position:     'absolute',
            top:          '10px',
            right:        '10px',
            background:   '#2ECC71',
            color:        '#fff',
            padding:      '3px 10px',
            borderRadius: '20px',
            fontSize:     '11px',
            fontWeight:   700,
          }}>
            FREE
          </span>
        )}

        {/* Ticket badge */}
        {listing.category === 'tickets_events' && (
          <span style={{
            position:     'absolute',
            bottom:       '10px',
            left:         '10px',
            background:   'rgba(255,107,0,0.9)',
            color:        '#1A1A0E',
            padding:      '3px 10px',
            borderRadius: '20px',
            fontSize:     '11px',
            fontWeight:   700,
          }}>
            🎟️ Ticket
          </span>
        )}

        {/* Size badge */}
        {(listing.size_clothes || listing.size_shoes) && (
          <span style={{
            position:       'absolute',
            bottom:         '10px',
            right:          '10px',
            background:     'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            color:          '#fff',
            padding:        '3px 10px',
            borderRadius:   '20px',
            fontSize:       '12px',
            fontWeight:     700,
          }}>
            {listing.size_clothes ?? listing.size_shoes}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px' }}>
        <p style={{
          color:          '#fff',
          fontWeight:     600,
          fontSize:       '15px',
          margin:         '0 0 4px',
          overflow:       'hidden',
          textOverflow:   'ellipsis',
          whiteSpace:     'nowrap',
        }}>
          {listing.title}
        </p>

        {listing.brand && (
          <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px', fontStyle: 'italic' }}>
            {listing.brand}
          </p>
        )}

        <p style={{
          color:       '#888',
          fontSize:    '12px',
          margin:      '0 0 10px',
          display:     'flex',
          alignItems:  'center',
          gap:         '6px',
        }}>
          {cat?.label}
          {listing.neighborhood && ` • ${listing.neighborhood}`}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{
              color:      listing.is_free ? '#2ECC71' : '#FF6B00',
              fontWeight: 700,
              fontSize:   '20px',
              margin:     0,
              lineHeight: 1,
            }}>
              {listing.is_free ? 'Free' : `€${listing.price}`}
            </p>
            {listing.is_negotiable && (
              <p style={{ color: '#555', fontSize: '11px', margin: '2px 0 0' }}>Negotiable</p>
            )}
          </div>
          <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
            {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
    </Link>
  )
}
