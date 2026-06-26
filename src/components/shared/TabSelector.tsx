'use client'

export function TabSelector({
  options,
  active,
  onChange,
}: {
  options:  string[]
  active:   string
  onChange: (val: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0', marginBottom: '24px' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            background:    opt === active ? 'var(--accent-blue)' : 'transparent',
            border:        opt === active ? 'none' : '1px solid var(--border-subtle)',
            color:         opt === active ? '#fff' : 'var(--text-secondary)',
            padding:       '8px 20px',
            fontSize:      '13px',
            fontWeight:    700,
            textTransform: 'uppercase',
            cursor:        'pointer',
            borderRadius:  '4px',
            letterSpacing: '0.02em',
            transition:    'background 0.15s, color 0.15s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
