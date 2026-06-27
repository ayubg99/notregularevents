import { Camera, MessageCircle, Music2, MapPin } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const SOCIALS = [
  { href: 'https://instagram.com/notregularevents', icon: Camera,        label: 'Instagram', handle: '@notregularevents', color: 'hover:text-brand-primary' },
  { href: '#whatsapp',                              icon: MessageCircle,  label: 'WhatsApp',  handle: 'Community Chat',    color: 'hover:text-brand-primary' },
  { href: '#tiktok',                                icon: Music2,         label: 'TikTok',    handle: '@notregularevents', color: 'hover:text-brand-primary' },
]

export default function Footer() {
  const t    = useTranslations('footer')
  const tNav = useTranslations('nav')

  const sections = [
    {
      heading: t('explore'),
      links: [
        { href: '/events',      label: tNav('events')     },
        { href: '/housing',     label: tNav('housing')    },
        { href: '/community',   label: tNav('community')  },
        { href: '/membership',  label: tNav('membership') },
        { href: '/ambassadors', label: t('ambassadors')   },
      ],
    },
    {
      heading: t('communityHeading'),
      links: [
        { href: '/about',    label: t('aboutUs')  },
        { href: '/reviews',  label: t('reviews')  },
        { href: '/blog',     label: t('blog')     },
      ],
    },
    {
      heading: t('legal'),
      links: [
        { href: '/privacy', label: t('privacyPolicy')  },
        { href: '/terms',   label: t('termsOfService') },
        { href: '/cookies', label: t('cookiePolicy')   },
        { href: '/refunds', label: t('refundPolicy')   },
      ],
    },
  ]

  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Logo size="small" />
              </Link>
              <span className="text-white/30 text-sm font-bold">/ Madrid</span>
            </div>

            <p className="text-white/60 text-sm leading-relaxed max-w-xs">{t('tagline')}</p>

            <div className="flex items-center gap-2 text-white/40 text-sm">
              <MapPin size={14} className="flex-shrink-0" />
              <span>Madrid, Spain 🇪🇸</span>
            </div>

            <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>+34 672 587 453</span>
              <span>notregularevents@gmail.com</span>
            </div>

            <div className="flex flex-col gap-3">
              {SOCIALS.map(({ href, icon: Icon, label, handle, color }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`flex items-center gap-3 text-white/50 ${color} transition-colors duration-200 group w-fit`} aria-label={label}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <Icon size={15} />
                  </span>
                  <span className="text-sm">{handle}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map(({ heading, links }) => (
            <div key={heading} className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30">{heading}</h3>
              <ul className="flex flex-col gap-3">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-white/60 hover:text-white transition-colors duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">© 2026 Not Regular Events. Madrid.</p>
          <p className="text-white/20 text-xs">{t('rightsReserved')}</p>
        </div>
      </div>
    </footer>
  )
}
