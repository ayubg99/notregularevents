'use client'

import Link from 'next/link'

export default function EventDetailError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-white/50 text-lg mb-6">Failed to load this event.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-brand-primary hover:brightness-110 text-white font-semibold text-sm transition-all"
          >
            Try again
          </button>
          <Link
            href="/events"
            className="px-5 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-medium transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    </main>
  )
}
