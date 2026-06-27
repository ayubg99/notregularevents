export default function EventsLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="h-4 w-24 rounded bg-white/10 animate-pulse mb-2" />
          <div className="h-10 w-64 rounded-lg bg-white/10 animate-pulse mb-3" />
          <div className="h-4 w-96 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden glass-card">
              <div className="h-48 bg-white/10 animate-pulse" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
