'use client'

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
        {videos.map((item) => (
          <div
            key={item.id}
            className="group"
            style={{ position: 'relative', flexShrink: 0, width: '320px', aspectRatio: '9/14', overflow: 'hidden', background: '#161616' }}
          >
            <video
              src={item.video_url}
              poster={item.thumbnail_url ?? undefined}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              className="transition-transform duration-500 group-hover:scale-105 group-active:scale-105"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
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
    </section>
  )
}
