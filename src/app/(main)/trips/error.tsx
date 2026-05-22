'use client'

export default function TripsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-brand-dark pt-28 pb-24 flex items-start justify-center">
      <div className="text-center px-4 pt-20">
        <p className="text-white/50 text-lg mb-6">Failed to load trips. Please try again.</p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-brand-primary hover:brightness-110 text-white font-semibold text-sm transition-all"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
