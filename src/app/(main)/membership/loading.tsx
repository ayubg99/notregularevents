export default function MembershipLoading() {
  return (
    <main className="min-h-screen bg-brand-dark pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="h-4 w-32 rounded bg-white/10 animate-pulse mx-auto mb-4" />
          <div className="h-12 w-64 rounded-xl bg-white/10 animate-pulse mx-auto mb-4" />
          <div className="h-6 w-96 rounded bg-white/10 animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl glass-card p-8 flex flex-col gap-4">
              <div className="h-6 w-24 rounded bg-white/10 animate-pulse" />
              <div className="h-10 w-20 rounded-lg bg-white/10 animate-pulse" />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 w-full rounded bg-white/10 animate-pulse" />
              ))}
              <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse mt-4" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
