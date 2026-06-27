'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Hero({
  nextEvent,
}: {
  nextEvent: Record<string, unknown> | null
}) {
  const t      = useTranslations('hero')
  const locale = useLocale()

  return (
    <section
      style={{
        position:      'relative',
        minHeight:     '92vh',
        display:       'flex',
        flexDirection: 'column',
        justifyContent:'flex-end',
        overflow:      'hidden',
      }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position:  'absolute',
          inset:     0,
          width:     '100%',
          height:    '100%',
          objectFit: 'cover',
          zIndex:    -2,
        }}
      >
        <source src="/party-2.mp4" type="video/mp4" />
      </video>

      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: 'linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.96) 100%)',
          zIndex:     -1,
        }}
      />

      <div className="container-marketing" style={{ paddingBottom: '60px' }}>
        <p
          style={{
            fontFamily:    'var(--font-jetbrains), monospace',
            color:         'var(--accent-yellow)',
            fontWeight:    700,
            fontSize:      '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom:  '12px',
          }}
        >
          {t('tag')}
        </p>

        <h1
          style={{
            fontFamily:    'var(--font-anton), Anton, sans-serif',
            fontSize:      'clamp(48px, 9vw, 110px)',
            color:         '#fff',
            margin:        0,
            lineHeight:    0.95,
            textTransform: 'uppercase',
          }}
        >
          {t('titleLine1')}
          <br />
          <span style={{ color: 'var(--accent-blue)' }}>{t('titleLine2')}</span>
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color:      'var(--text-secondary)',
            fontSize:   '14px',
            maxWidth:   '600px',
            marginTop:  '20px',
            lineHeight: 1.6,
          }}
        >
          {t('description')}
        </p>

        <div
          style={{
            display:   'flex',
            gap:       '12px',
            marginTop: '28px',
            flexWrap:  'wrap',
          }}
        >
          <Link
            href="/events"
            style={{
              background:     'var(--accent-blue)',
              color:          '#fff',
              padding:        '14px 28px',
              fontFamily:     'var(--font-jetbrains), monospace',
              fontWeight:     700,
              fontSize:       '14px',
              textDecoration: 'none',
              borderRadius:   '4px',
            }}
          >
            {t('ctaPrimary')} →
          </Link>
          <Link
            href="/community"
            style={{
              background:     'transparent',
              border:         '1px solid rgba(255,255,255,0.3)',
              color:          '#fff',
              padding:        '14px 28px',
              fontFamily:     'var(--font-jetbrains), monospace',
              fontWeight:     700,
              fontSize:       '14px',
              textDecoration: 'none',
              borderRadius:   '4px',
            }}
          >
            {t('ctaSecondary')}
          </Link>
        </div>

        {nextEvent && (
          <Link
            href={`/events/${nextEvent.slug}`}
            style={{
              display:              'flex',
              alignItems:           'center',
              gap:                  '16px',
              marginTop:            '40px',
              padding:              '16px 20px',
              background:           'rgba(255,255,255,0.04)',
              border:               '1px solid var(--border-subtle)',
              borderRadius:         '6px',
              textDecoration:       'none',
              maxWidth:             '560px',
              backdropFilter:       'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                width:        '8px',
                height:       '8px',
                borderRadius: '50%',
                background:   'var(--accent-blue)',
                flexShrink:   0,
                animation:    'pulse 2s infinite',
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily:    'var(--font-jetbrains), monospace',
                  color:         'var(--accent-blue)',
                  fontSize:      '11px',
                  fontWeight:    700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  margin:        '0 0 4px',
                }}
              >
                {t('nextUp')} —{' '}
                {new Date(nextEvent.date as string).toLocaleDateString(
                  locale === 'es' ? 'es-ES' : 'en-GB',
                  { weekday: 'short', day: 'numeric', month: 'short' }
                )}
              </p>
              <p
                style={{
                  fontFamily:   'var(--font-jetbrains), monospace',
                  color:        '#fff',
                  fontWeight:   700,
                  fontSize:     '14px',
                  margin:       0,
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nextEvent.title as string}
                {nextEvent.location ? ` — ${nextEvent.location as string}` : ''}
              </p>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color:      'var(--text-secondary)',
                fontSize:   '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t('tickets')} →
            </span>
          </Link>
        )}
      </div>

      <div
        style={{
          position:      'absolute',
          bottom:        '20px',
          left:          '50%',
          transform:     'translateX(-50%)',
          textAlign:     'center',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            color:         'var(--text-muted)',
            fontFamily:    'var(--font-jetbrains), monospace',
            fontSize:      '11px',
            letterSpacing: '0.1em',
            margin:        0,
          }}
        >
          SCROLL
        </p>
      </div>
    </section>
  )
}
