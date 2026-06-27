import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function HousingBanner() {
  const t = useTranslations('housingBanner')

  return (
    <div className="container-marketing py-5">
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md px-6 py-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <p className="font-mono text-sm font-semibold text-white sm:truncate">
            {t('text')}{' '}
            <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>
              {t('subtext')}
            </span>
          </p>
        </div>

        <Link
          href="/housing"
          className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 font-mono font-bold text-xs uppercase tracking-wide rounded whitespace-nowrap transition-colors duration-200 border border-[var(--accent-blue)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white"
        >
          {t('cta')} →
        </Link>
      </div>
    </div>
  )
}
