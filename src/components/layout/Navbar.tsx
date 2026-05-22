'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

const NAV_HREFS = [
  { href: '/events',     key: 'events'     },
  { href: '/trips',      key: 'trips'      },
  { href: '/community',  key: 'community'  },
  { href: '/membership', key: 'membership' },
  { href: '/about',      key: 'about'      },
] as const

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (email) return email[0].toUpperCase()
  return '?'
}

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [isScrolled,  setIsScrolled]  = useState(false)
  const [isMenuOpen,  setIsMenuOpen]  = useState(false)
  const [menuKey,     setMenuKey]     = useState(0)
  const [authUser,    setAuthUser]    = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  const openMenu = () => {
    setMenuKey(k => k + 1)
    setIsMenuOpen(true)
  }
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      {/* ── Main nav bar ─────────────────────────────────────────── */}
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300
          ${isScrolled ? 'backdrop-blur-2xl bg-brand-dark/80 border-b border-white/5 shadow-brand-sm py-3' : 'bg-brand-dark/50 py-5'}
        `}
        style={{ animation: 'navSlideDown 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 group flex-shrink-0">
              <span className="font-heading text-xl font-bold text-white tracking-tight">
                Erasmus Vibe
              </span>
              <span className="w-2 h-2 rounded-full bg-brand-primary group-hover:scale-150 transition-transform duration-200" />
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_HREFS.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium transition-colors duration-200 group ${isActive ? 'text-white' : 'text-white/70 hover:text-white'}`}
                  >
                    {t(link.key)}
                    <span className={`absolute -bottom-0.5 left-0 h-px bg-brand-primary rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                )
              })}
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-2">

              {/* Auth controls — desktop */}
              {authUser ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-all duration-200"
                  >
                    <LayoutDashboard size={15} />
                    {t('dashboard')}
                  </Link>
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-brand-primary text-xs">
                      {getInitials(
                        authUser.user_metadata?.full_name as string | undefined,
                        authUser.email,
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center w-9 h-9 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
                    aria-label={t('signOut')}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/register"
                  className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 btn-primary text-sm"
                >
                  {t('joinNow')}
                  <ChevronRight size={14} strokeWidth={2.5} />
                </Link>
              )}

              {/* Hamburger — mobile */}
              <button
                onClick={() => (isMenuOpen ? closeMenu() : openMenu())}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                <span className="transition-transform duration-150">
                  {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile full-screen menu ───────────────────────────────── */}
      <div
        className={`
          fixed inset-0 z-40 glass-dark flex flex-col items-center justify-center gap-2 md:hidden
          transition-opacity duration-200
          ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Nav links with CSS stagger */}
        <nav className="flex flex-col items-center gap-6">
          {NAV_HREFS.map((link, i) => (
            <div
              key={`${menuKey}-${link.href}`}
              style={isMenuOpen ? {
                animation: `menuItemIn 0.3s ease-out ${0.05 + i * 0.07}s both`,
              } : undefined}
            >
              <Link
                href={link.href}
                onClick={closeMenu}
                className="font-heading text-4xl font-bold text-white hover:text-brand-primary transition-colors duration-200"
              >
                {t(link.key)}
              </Link>
            </div>
          ))}
        </nav>

        {/* CTA + theme toggle */}
        <div
          key={`${menuKey}-cta`}
          className="flex flex-col items-center gap-5 mt-10"
          style={isMenuOpen ? {
            animation: `menuItemIn 0.3s ease-out ${0.05 + NAV_HREFS.length * 0.07}s both`,
          } : undefined}
        >
          {authUser ? (
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="flex items-center gap-2 px-10 py-4 bg-white/10 text-white font-semibold text-lg rounded-full active:brightness-90 transition-all"
              >
                <LayoutDashboard size={20} />
                {t('dashboard')}
              </Link>
              <button
                onClick={() => { closeMenu(); handleSignOut() }}
                className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
              >
                <LogOut size={16} />
                <span>{t('signOut')}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/register"
              onClick={closeMenu}
              className="flex items-center gap-2 px-10 py-4 btn-primary text-lg"
            >
              {t('joinNow')}
              <ChevronRight size={18} strokeWidth={2.5} />
            </Link>
          )}
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />
      </div>
    </>
  )
}
