'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface RecapVideo {
  id:               string
  video_url:        string
  thumbnail_url:    string | null
  overlay_title:    string | null
  overlay_subtitle: string | null
}

export function PartyRecapStrip({ videos }: { videos: RecapVideo[] }) {
  const t = useTranslations('partyRecap')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!videos || videos.length === 0) return null

  return (
    <section style={{ background: '#0A0A0A', padding: '60px 0 80px' }}>
      <div
        className="container-marketing"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}
      >
        <h2 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 'clamp(28px, 4vw, 48px)', color: '#fff', margin: 0, textTransform: 'uppercase', lineHeight: 0.95 }}>
          {t('sectionTitle')}
        </h2>
        <p style={{ color: '#6B6B6B', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', margin: 0 }}>
          {t('tag')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 24px', maxWidth: 'var(--max-width-marketing)', margin: '0 auto' }}>
        {videos.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setLightboxIndex(index)}
            style={{ position: 'relative', flexShrink: 0, width: '320px', aspectRatio: '9/14', cursor: 'pointer', overflow: 'hidden', background: '#161616' }}
          >
            <video src={item.video_url} poster={item.thumbnail_url ?? undefined} muted loop autoPlay playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            </div>
            {item.overlay_title && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '18px', color: '#fff', margin: '0 0 4px', textTransform: 'uppercase' }}>{item.overlay_title}</p>
                {item.overlay_subtitle && (
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '13px', color: '#F4D03F', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.overlay_subtitle}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div onClick={() => setLightboxIndex(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <button onClick={() => setLightboxIndex(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          <video src={videos[lightboxIndex].video_url} controls autoPlay onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', maxWidth: '90vw' }} />
        </div>
      )}
    </section>
  )
}
