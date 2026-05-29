import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Slim top bar */}
      <header className="border-b border-white/8 bg-brand-dark/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo.png" alt="Erasmus Vibe" width={140} height={36} className="h-9 w-auto" priority />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/jobs" className="text-white/50 hover:text-white transition-colors">
              Browse Jobs
            </Link>
            <Link href="/" className="text-white/40 hover:text-white/70 transition-colors text-xs">
              ← Back to site
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
