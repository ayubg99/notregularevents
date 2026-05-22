'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, MapPin, Users, Ticket, LogOut, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin',          label: 'Overview',  icon: <LayoutDashboard size={16} /> },
  { href: '/admin/events',   label: 'Events',    icon: <Calendar size={16} />        },
  { href: '/admin/trips',    label: 'Trips',     icon: <MapPin size={16} />          },
  { href: '/admin/users',    label: 'Users',     icon: <Users size={16} />           },
  { href: '/admin/bookings', label: 'Bookings',  icon: <Ticket size={16} />          },
]

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
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2">
        <span className="font-heading text-base font-bold text-white tracking-tight">Erasmus Vibe</span>
        <span className="text-xs font-bold text-brand-accent bg-brand-accent/15 border border-brand-accent/30 px-1.5 py-0.5 rounded-md">
          Admin
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon }) => {
          const isActive = href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/25'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
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
