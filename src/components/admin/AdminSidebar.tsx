'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, MapPin, Users, Ticket, Tag, LogOut, ArrowLeft, BarChart2, QrCode, Home, Building2, Star, Briefcase, Mail, ShoppingBag, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin',             label: 'Overview',    icon: <LayoutDashboard size={16} /> },
  { href: '/admin/events',      label: 'Events',      icon: <Calendar size={16} />        },
  { href: '/admin/trips',       label: 'Trips',       icon: <MapPin size={16} />          },
  { href: '/admin/housing',          label: 'Housing',  icon: <Home size={16} />      },
  { href: '/admin/housing-partners', label: 'Partner Rooms', icon: <Building2 size={16} /> },
  { href: '/admin/jobs',         label: 'Jobs',        icon: <Briefcase size={16} />      },
  { href: '/admin/marketplace',  label: 'Marketplace', icon: <ShoppingBag size={16} />    },
  { href: '/admin/employers',    label: 'Employers',   icon: <Building2 size={16} />      },
  { href: '/admin/ambassadors', label: 'Ambassadors', icon: <Star size={16} />            },
  { href: '/admin/sponsors',    label: 'Sponsors',    icon: <Star size={16} />            },
  { href: '/admin/users',       label: 'Members',     icon: <Users size={16} />           },
  { href: '/admin/bookings',    label: 'Bookings',    icon: <Ticket size={16} />          },
  { href: '/admin/promo-codes', label: 'Promo Codes',    icon: <Tag size={16} />        },
  { href: '/admin/stripe',      label: 'Stripe Connect', icon: <CreditCard size={16} /> },
  { href: '/admin/newsletter',  label: 'Newsletter',     icon: <Mail size={16} />        },
  { href: '/admin/analytics',   label: 'Analytics',   icon: <BarChart2 size={16} />       },
  { href: '/scanner',           label: 'Scanner',     icon: <QrCode size={16} />, external: true, neverActive: true },
] as const

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 bg-brand-dark border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Erasmus Life"
          width={120}
          height={36}
          className="h-9 w-auto object-contain"
          priority
        />
        <span className="text-xs font-bold text-brand-accent bg-brand-accent/15 border border-brand-accent/30 px-1.5 py-0.5 rounded-md">
          Admin
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon, ...rest }) => {
          const external   = 'external'   in rest && rest.external
          const neverActive = 'neverActive' in rest && rest.neverActive
          const isActive = (() => {
            if (neverActive) return false
            if (href === '/admin') return pathname === '/admin'
            if (href === '/admin/housing') {
              return pathname === '/admin/housing' ||
                (pathname.startsWith('/admin/housing') && !pathname.startsWith('/admin/housing-partners'))
            }
            if (href === '/admin/housing-partners') {
              return pathname.startsWith('/admin/housing-partners')
            }
            return pathname.startsWith(href)
          })()

          const baseClass = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150'
          const activeClass = isActive
            ? 'bg-orange-500/20 text-orange-400 border border-orange-400/25'
            : 'text-white/50 hover:text-white hover:bg-white/5'

          if (external) {
            return (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseClass} text-white/50 hover:text-white hover:bg-white/5`}
              >
                {icon}
                {label}
              </a>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={`${baseClass} ${activeClass}`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all duration-150"
        >
          <ArrowLeft size={16} />
          Back to site
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 w-full text-left"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
