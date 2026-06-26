'use client'

export function EventsSectionHeader({
  title,
  tag,
  showTabs = false,
  cities = ['Madrid', 'Marbella'],
  activeCity,
  onCityChange,
}: {
  title: string
  tag: string
  showTabs?: boolean
  cities?: string[]
  activeCity?: string
  onCityChange?: (city: string) => void
}) {
  return (
    <div className="container-marketing" style={{ paddingTop: '40px', paddingBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: showTabs ? '20px' : 0,
      }}>
        <h2 style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(36px, 6vw, 64px)',
          color: '#fff',
          margin: 0,
          textTransform: 'uppercase',
          lineHeight: 0.9,
        }}>
          {title}
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          fontSize: '12px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          margin: 0,
        }}>
          {tag}
        </p>
      </div>

      {showTabs && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {cities.map(city => (
            <button
              key={city}
              onClick={() => onCityChange?.(city)}
              style={{
                background: activeCity === city ? 'var(--accent-blue)' : 'transparent',
                border: activeCity === city ? 'none' : '1px solid var(--border-subtle)',
                color: activeCity === city ? '#fff' : 'var(--text-secondary)',
                padding: '8px 20px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
