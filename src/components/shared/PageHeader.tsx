export function PageHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'flex-end',
      padding:        '40px 24px 24px',
      maxWidth:       '1400px',
      margin:         '0 auto',
      borderBottom:   '1px solid var(--border-subtle)',
    }}>
      <h1 style={{
        fontFamily:    'Anton, sans-serif',
        fontSize:      'clamp(32px, 5vw, 64px)',
        color:         '#fff',
        margin:        0,
        textTransform: 'uppercase',
        lineHeight:    0.95,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h1>
      <p style={{
        color:          'var(--text-muted)',
        fontFamily:     'Inter, sans-serif',
        fontWeight:     700,
        fontSize:       '12px',
        letterSpacing:  '0.08em',
        textTransform:  'uppercase',
        whiteSpace:     'nowrap',
        margin:         0,
      }}>
        {'// '}{tag}
      </p>
    </div>
  )
}
