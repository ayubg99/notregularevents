export default function TripDetailLoading() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <div className="h-[55vh] md:h-[65vh] bg-white/10 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div className="flex flex-col gap-6">
            <div className="h-24 w-full rounded-xl bg-white/10 animate-pulse" />
            <div className="h-48 w-full rounded-2xl bg-white/10 animate-pulse" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-40 w-full rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-52 w-full rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  )
}
