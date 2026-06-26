export function PageHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div
      className="container-marketing"
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-end',
        paddingTop:     '40px',
        paddingBottom:  '24px',
        borderBottom:   '1px solid var(--border-subtle)',
      }}
    >
      <h1 style={{
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      'clamp(28px, 4.5vw, 56px)',
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
        fontFamily:     "'JetBrains Mono', monospace",
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
