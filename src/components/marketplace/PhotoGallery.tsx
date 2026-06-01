'use client'

import { useState } from 'react'

interface Props {
  photos:   string[]
  title:    string
  catEmoji: string
}

export default function PhotoGallery({ photos, title, catEmoji }: Props) {
  const [active, setActive] = useState(0)

  if (photos.length === 0) {
    return (
      <div style={{
        borderRadius:   '16px',
        overflow:       'hidden',
        marginBottom:   '20px',
        background:     'linear-gradient(135deg, #4ECDC4, #2ECC71)',
        height:         '340px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '80px',
      }}>
        {catEmoji}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Main photo */}
      <div style={{
        borderRadius:   '16px',
        overflow:       'hidden',
        marginBottom:   '10px',
        background:     '#111',
        height:         '340px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active]}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width:        '72px',
                height:       '72px',
                flexShrink:   0,
                borderRadius: '8px',
                overflow:     'hidden',
                border:       i === active ? '2px solid #4ECDC4' : '2px solid transparent',
                padding:      0,
                cursor:       'pointer',
                opacity:      i === active ? 1 : 0.6,
                transition:   'opacity 0.15s, border 0.15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Photo ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
