import Link from 'next/link'
import Image from 'next/image'
import { Camera, MessageCircle, Music2, MapPin } from 'lucide-react'
import FooterNewsletter from './FooterNewsletter'
// lucide-react v1+ dropped brand icons; Camera ≈ Instagram, MessageCircle ≈ WhatsApp, Music2 ≈ TikTok

const FOOTER_LINKS = {
  Explore: [
    { href: '/events',     label: 'Events'      },
    { href: '/housing',    label: 'Housing'     },
    { href: '/community',  label: 'Community'   },
    { href: '/membership', label: 'Membership'  },
    { href: '/ambassadors', label: 'Ambassadors' },
  ],
  Community: [
    { href: '/about',    label: 'About Us'  },
    { href: '/team',     label: 'Our Team'  },
    { href: '/reviews',  label: 'Reviews'   },
    { href: '/blog',     label: 'Blog'      },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms',   label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy'   },
    { href: '/refunds', label: 'Refund Policy'   },
  ],
}

const SOCIALS = [
  {
    href:    'https://instagram.com/erasmuslifevalencia',
    icon:    Camera,
    label:   'Instagram',
    handle:  '@erasmuslifevalencia',
    color:   'hover:text-brand-primary',
  },
  {
    href:    '#whatsapp',
    icon:    MessageCircle,
    label:   'WhatsApp',
    handle:  'Community Chat',
    color:   'hover:text-brand-primary',
  },
  {
    href:    '#tiktok',
    icon:    Music2,
    label:   'TikTok',
    handle:  '@erasmuslifevalencia',
    color:   'hover:text-brand-primary',
  },
]

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Logo */}
            <Link href="/" className="w-fit">
              <Image
                src="/logo.png"
                alt="Erasmus Life"
                width={200}
                height={52}
                className="h-14 w-auto"
              />
            </Link>

            {/* Tagline */}
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              The official Erasmus community in Valencia since 1994. Events, trips, and everything students need for an unforgettable semester.
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <MapPin size={14} className="flex-shrink-0" />
              <span>Valencia, Spain 🇪🇸</span>
            </div>

            {/* Socials */}
            <div className="flex flex-col gap-3">
              {SOCIALS.map(({ href, icon: Icon, label, handle, color }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`flex items-center gap-3 text-white/50 ${color} transition-colors duration-200 group w-fit`}
                  aria-label={label}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <Icon size={15} />
                  </span>
                  <span className="text-sm">{handle}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30">
                {category}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Newsletter ─────────────────────────────────────────── */}
        <div className="mt-14 pt-10 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg text-white">
                Stay in the loop
              </h3>
              <p className="text-white/50 text-sm mt-1">
                Get event drops, trip alerts & exclusive offers — no spam, ever.
              </p>
            </div>

            <FooterNewsletter />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="border-t border-[rgba(255,255,255,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">
            © {new Date().getFullYear()} Erasmus Life Valencia. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Made for Erasmus students in Valencia
          </p>
        </div>
      </div>

    </footer>
  )
}
