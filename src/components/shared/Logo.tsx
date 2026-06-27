const SIZES = {
  small:   { fontSize: '12px', iconSize: '22px', iconFontSize: '11px', gap: '7px' },
  default: { fontSize: '15px', iconSize: '32px', iconFontSize: '16px', gap: '10px' },
  large:   { fontSize: '24px', iconSize: '48px', iconFontSize: '24px', gap: '14px' },
}

export function Logo({
  size = 'default',
  showIcon = false,
}: {
  size?: 'small' | 'default' | 'large'
  showIcon?: boolean
}) {
  const s = SIZES[size]

  if (showIcon) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap }}>
        <span style={{
          width:           s.iconSize,
          height:          s.iconSize,
          borderRadius:    '6px',
          background:      'var(--accent-blue)',
          display:         'inline-flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          <span style={{
            fontFamily:  'var(--font-primary)',
            fontWeight:  800,
            fontSize:    s.iconFontSize,
            color:       '#fff',
            lineHeight:  1,
          }}>N</span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontFamily:    'var(--font-primary)',
            fontWeight:    800,
            fontSize:      s.fontSize,
            color:         '#fff',
            letterSpacing: '-0.02em',
          }}>NOT REGULAR</span>
          <span style={{
            fontFamily:    'var(--font-primary)',
            fontWeight:    500,
            fontSize:      `calc(${s.fontSize} * 0.72)`,
            color:         'var(--accent-blue)',
            letterSpacing: '0.05em',
            marginTop:     '2px',
          }}>EVENTS</span>
        </span>
      </span>
    )
  }

  return (
    <span style={{
      fontFamily:    'var(--font-primary)',
      fontWeight:    800,
      fontSize:      s.fontSize,
      color:         '#fff',
      letterSpacing: '-0.02em',
      lineHeight:    1,
    }}>
      NOT REGULAR{' '}
      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>EVENTS</span>
    </span>
  )
}
