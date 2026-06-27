'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageSwitcher() {
  const locale  = useLocale()
  const router  = useRouter()
  const pathname = usePathname()

  const switchTo = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div style={{ display: 'flex', gap: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600 }}>
      {(['es', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          style={{
            background:    'none',
            border:        locale === l ? '1px solid rgba(255,255,255,0.3)' : 'none',
            cursor:        'pointer',
            color:         locale === l ? '#fff' : 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            padding:       '3px 7px',
            borderRadius:  '3px',
            transition:    'color 0.2s',
          }}
          aria-label={`Switch to ${l === 'es' ? 'Spanish' : 'English'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
