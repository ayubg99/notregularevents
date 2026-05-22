export default function TripsLoading() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="h-4 w-36 rounded bg-white/10 animate-pulse mx-auto mb-4" />
          <div className="h-16 w-80 rounded-xl bg-white/10 animate-pulse mx-auto mb-6" />
          <div className="h-6 w-96 rounded bg-white/10 animate-pulse mx-auto" />
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden glass-card">
              <div className="h-52 bg-white/10 animate-pulse" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-white/10 animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
