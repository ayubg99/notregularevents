export default function EventDetailLoading() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <div className="h-[55vh] md:h-[65vh] bg-white/10 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex gap-6">
              <div className="h-5 w-48 rounded bg-white/10 animate-pulse" />
              <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="h-24 w-full rounded-xl bg-white/10 animate-pulse" />
            <div className="h-32 w-full rounded-xl bg-white/10 animate-pulse" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-48 w-full rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-16 w-full rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  )
}
