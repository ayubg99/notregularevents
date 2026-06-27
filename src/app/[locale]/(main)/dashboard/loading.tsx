export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-brand-dark pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl bg-white/10 animate-pulse" />
          <div className="flex flex-col gap-6">
            <div className="h-40 rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-56 rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  )
}
