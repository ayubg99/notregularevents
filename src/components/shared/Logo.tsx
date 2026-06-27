const FONT_SIZE = { small: '12px', default: '15px', large: '24px' }

export function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  return (
    <span style={{
      fontFamily:    'var(--font-primary)',
      fontWeight:    800,
      fontSize:      FONT_SIZE[size],
      color:         '#fff',
      letterSpacing: '-0.02em',
      lineHeight:    1,
    }}>
      NOT REGULAR{' '}
      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>EVENTS</span>
    </span>
  )
}
