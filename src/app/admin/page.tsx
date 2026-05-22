import { Ticket, MapPin, Users, Calendar, TrendingUp } from 'lucide-react'
import { getAdminClient } from '@/lib/supabase/admin'
import StatsCard from '@/components/admin/StatsCard'
import ActivityChart from './ActivityChart'

function groupByDate(rows: { created_at: string }[]): { date: string; bookings: number }[] {
  const counts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    counts[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of rows) {
    const date = row.created_at.slice(0, 10)
    if (date in counts) counts[date] = (counts[date] ?? 0) + 1
  }
  return Object.entries(counts).map(([date, bookings]) => ({ date, bookings }))
}

const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

export default async function AdminPage() {
  const admin = getAdminClient()
  const now   = new Date().toISOString()

  const [
    { count: totalTickets },
    { count: totalTrips },
    { count: activeMembers },
    { count: upcomingEvents },
    { data: recentTicketRows },
    { data: recentTripRows },
    { data: recentTickets30 },
    { data: recentTrips30 },
  ] = await Promise.all([
    admin.from('event_tickets').select('*', { count: 'exact', head: true }),
    admin.from('trip_bookings').select('*', { count: 'exact', head: true }),
    admin.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('date', now),
    admin.from('event_tickets').select('booking_ref, created_at, events(title)').order('created_at', { ascending: false }).limit(6),
    admin.from('trip_bookings').select('booking_ref, created_at, trips(title)').order('created_at', { ascending: false }).limit(6),
    admin.from('event_tickets').select('created_at').gte('created_at', thirtyDaysAgo),
    admin.from('trip_bookings').select('created_at').gte('created_at', thirtyDaysAgo),
  ])

  const activityData = groupByDate([...(recentTickets30 ?? []), ...(recentTrips30 ?? [])])

  type RecentItem = { ref: string; title: string; kind: string; date: string }
  const recentBookings: RecentItem[] = [
    ...(recentTicketRows ?? []).map(t => ({
      ref:   t.booking_ref,
      title: (t.events as unknown as { title: string } | null)?.title ?? 'Unknown event',
      kind:  'Event',
      date:  t.created_at,
    })),
    ...(recentTripRows ?? []).map(t => ({
      ref:   t.booking_ref,
      title: (t.trips as unknown as { title: string } | null)?.title ?? 'Unknown trip',
      kind:  'Trip',
      date:  t.created_at,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Overview</h1>
        <p className="text-white/40 text-sm">Welcome to the Erasmus Vibe admin dashboard.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="Event Tickets"    value={totalTickets  ?? 0} icon={<Ticket   size={18} />} color="bg-brand-primary/15" />
        <StatsCard label="Trip Bookings"    value={totalTrips    ?? 0} icon={<MapPin   size={18} />} color="bg-purple-500/15" />
        <StatsCard label="Active Members"   value={activeMembers ?? 0} icon={<Users    size={18} />} color="bg-green-500/15" />
        <StatsCard label="Upcoming Events"  value={upcomingEvents ?? 0} icon={<Calendar size={18} />} color="bg-amber-500/15" />
      </div>

      {/* Chart + recent bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <ActivityChart data={activityData} />
        </div>

        <div className="xl:col-span-2">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-heading font-bold text-white text-base mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-primary" />
              Recent Bookings
            </h3>
            <div className="flex flex-col gap-2.5">
              {recentBookings.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No bookings yet</p>
              ) : recentBookings.map((b) => (
                <div key={b.ref} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{b.title}</p>
                    <p className="text-white/30 text-xs font-mono">{b.ref}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-white/8 text-white/50">
                    {b.kind}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
