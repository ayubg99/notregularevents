import { BarChart2, Ticket, TrendingUp, DollarSign, Calendar, MapPin, Users, Euro } from 'lucide-react'
import { getAdminClient } from '@/lib/supabase/admin'
import StatsCard from '@/components/admin/StatsCard'
import RevenueChart, { type MonthData } from '@/components/admin/RevenueChart'

export const dynamic = 'force-dynamic'

const MEMBERSHIP_PRICE: Record<string, number> = {
  basic: 9.99,
  premium: 24.99,
  vip: 39.99,
}

function getMembershipPrice(plan: string): number {
  return MEMBERSHIP_PRICE[plan] ?? 0
}

function sameMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr)
  return d.getFullYear() === year && d.getMonth() === month
}

function fmt(n: number): string {
  return n.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type EventTicketRow = {
  amount_paid: number | null
  created_at: string
  status: string
  events: { title: string; category: string } | null
}

type TripBookingRow = {
  amount_paid: number | null
  tier: string
  created_at: string
  status: string
  trips: { title: string; destination: string } | null
}

type MembershipRow = {
  plan: string
  status: string
  created_at: string
  start_date: string
}

export default async function AnalyticsPage() {
  const admin = getAdminClient()

  const [
    { data: rawEventBookings },
    { data: rawTripBookings },
    { data: rawMemberships },
  ] = await Promise.all([
    admin
      .from('event_tickets')
      .select('amount_paid, created_at, status, events(title, category)')
      .in('status', ['active', 'used'])
      .order('created_at', { ascending: true }),
    admin
      .from('trip_bookings')
      .select('amount_paid, tier, created_at, status, trips(title, destination)')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true }),
    admin
      .from('memberships')
      .select('plan, status, created_at, start_date')
      .eq('status', 'active'),
  ])

  const eb = (rawEventBookings as unknown as EventTicketRow[] | null) ?? []
  const tb = (rawTripBookings as unknown as TripBookingRow[] | null) ?? []
  const mb = (rawMemberships as unknown as MembershipRow[] | null) ?? []

  // ── Combined revenue entries ──
  type RevenueEntry = { amount: number; type: 'Event' | 'Trip' | 'Membership'; title: string; created_at: string }
  const allRevenue: RevenueEntry[] = [
    ...eb.map(b => ({
      amount: b.amount_paid ?? 0,
      type: 'Event' as const,
      title: b.events?.title ?? 'Unknown event',
      created_at: b.created_at,
    })),
    ...tb.map(b => ({
      amount: b.amount_paid ?? 0,
      type: 'Trip' as const,
      title: b.trips?.title ?? 'Unknown trip',
      created_at: b.created_at,
    })),
    ...mb.map(m => ({
      amount: getMembershipPrice(m.plan),
      type: 'Membership' as const,
      title: `${m.plan} membership`,
      created_at: m.created_at,
    })),
  ]

  // ── Top-level stats ──
  const totalRevenue = allRevenue.reduce((s, r) => s + r.amount, 0)

  const now = new Date()
  const thisMonthRevenue = allRevenue
    .filter(r => sameMonth(r.created_at, now.getFullYear(), now.getMonth()))
    .reduce((s, r) => s + r.amount, 0)
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1)
  const lastMonthRevenue = allRevenue
    .filter(r => sameMonth(r.created_at, lastMonthDate.getFullYear(), lastMonthDate.getMonth()))
    .reduce((s, r) => s + r.amount, 0)
  const growthPercent = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : thisMonthRevenue > 0 ? '100' : '0'

  const eventRevenue = eb.reduce((s, b) => s + (b.amount_paid ?? 0), 0)
  const tripRevenue  = tb.reduce((s, b) => s + (b.amount_paid ?? 0), 0)
  const membershipRevenue = mb.reduce((s, m) => s + getMembershipPrice(m.plan), 0)

  const totalBookings = eb.length + tb.length
  const avgOrderValue = totalBookings > 0 ? (totalRevenue / totalBookings) : 0

  // ── Monthly chart data (last 6 months) ──
  const monthlyData: MonthData[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i)
    const y = d.getFullYear()
    const m = d.getMonth()
    const label = d.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' })
    return {
      month: label,
      events:      eb.filter(b => sameMonth(b.created_at, y, m)).reduce((s, b) => s + (b.amount_paid ?? 0), 0),
      trips:       tb.filter(b => sameMonth(b.created_at, y, m)).reduce((s, b) => s + (b.amount_paid ?? 0), 0),
      memberships: mb.filter(mem => sameMonth(mem.created_at, y, m)).reduce((s, mem) => s + getMembershipPrice(mem.plan), 0),
    }
  })

  // ── Top events ──
  const eventMap: Record<string, { bookings: number; revenue: number; category: string }> = {}
  for (const b of eb) {
    const key = b.events?.title ?? 'Unknown'
    if (!eventMap[key]) eventMap[key] = { bookings: 0, revenue: 0, category: b.events?.category ?? '' }
    eventMap[key].bookings++
    eventMap[key].revenue += b.amount_paid ?? 0
  }
  const topEvents = Object.entries(eventMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  // ── Top trips ──
  const tripMap: Record<string, { bookings: number; revenue: number; destination: string }> = {}
  for (const b of tb) {
    const key = b.trips?.title ?? 'Unknown'
    if (!tripMap[key]) tripMap[key] = { bookings: 0, revenue: 0, destination: b.trips?.destination ?? '' }
    tripMap[key].bookings++
    tripMap[key].revenue += b.amount_paid ?? 0
  }
  const topTrips = Object.entries(tripMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  // ── Membership breakdown ──
  const mCount = { basic: 0, premium: 0, vip: 0 }
  for (const m of mb) {
    if (m.plan in mCount) mCount[m.plan as keyof typeof mCount]++
  }

  // ── Recent transactions (last 10) ──
  const recentTx = [...allRevenue]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  // ── Earnings ──
  const earnings10 = totalRevenue * 0.1
  const earnings10ThisMonth = thisMonthRevenue * 0.1

  const badgeColor = (type: string) => {
    if (type === 'Event') return 'bg-brand-primary/20 text-brand-primary'
    if (type === 'Trip')  return 'bg-teal-500/20 text-teal-400'
    return 'bg-amber-500/20 text-amber-400'
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Revenue Analytics</h1>
        <p className="text-white/40 text-sm">Financial overview across events, trips and memberships.</p>
      </div>

      {/* A — Top stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Total Revenue"
          value={`€${fmt(totalRevenue)}`}
          icon={<DollarSign size={18} />}
          color="bg-green-500/15"
        />
        <StatsCard
          label="This Month"
          value={`€${fmt(thisMonthRevenue)}`}
          delta={`${Number(growthPercent) >= 0 ? '+' : ''}${growthPercent}% vs last month`}
          icon={<TrendingUp size={18} />}
          color="bg-brand-primary/15"
        />
        <StatsCard
          label="Total Bookings"
          value={totalBookings}
          icon={<Ticket size={18} />}
          color="bg-purple-500/15"
        />
        <StatsCard
          label="Avg Order Value"
          value={`€${fmt(avgOrderValue)}`}
          icon={<BarChart2 size={18} />}
          color="bg-amber-500/15"
        />
      </div>

      {/* B — Revenue by type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Events', revenue: eventRevenue, sub: `${eb.length} bookings`, icon: <Calendar size={16} />, color: 'text-brand-primary' },
          { label: 'Trips',  revenue: tripRevenue,  sub: `${tb.length} bookings`, icon: <MapPin size={16} />,   color: 'text-teal-400'     },
          { label: 'Memberships', revenue: membershipRevenue, sub: `${mb.length} active`, icon: <Users size={16} />, color: 'text-amber-400' },
        ].map(({ label, revenue, sub, icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-6 flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <span className={color}>{icon}</span>
            </div>
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className="font-heading text-2xl font-bold text-white">€{fmt(revenue)}</p>
              <p className="text-white/30 text-xs mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* C — Monthly chart */}
      <RevenueChart data={monthlyData} />

      {/* D + E — Top performers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top events */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-bold text-white text-base mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-brand-primary" />
            Top Events
          </h3>
          {topEvents.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No event revenue yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs uppercase tracking-wider">
                  <th className="text-left pb-3 font-medium">Event</th>
                  <th className="text-right pb-3 font-medium">Bookings</th>
                  <th className="text-right pb-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topEvents.map(([title, data]) => (
                  <tr key={title}>
                    <td className="py-2.5 pr-3">
                      <p className="text-white font-medium text-xs truncate max-w-[160px]">{title}</p>
                      {data.category && <p className="text-white/30 text-xs capitalize">{data.category}</p>}
                    </td>
                    <td className="py-2.5 text-right text-white/60 text-xs">{data.bookings}</td>
                    <td className="py-2.5 text-right text-white font-semibold text-xs">€{fmt(data.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top trips */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-bold text-white text-base mb-4 flex items-center gap-2">
            <MapPin size={15} className="text-teal-400" />
            Top Trips
          </h3>
          {topTrips.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No trip revenue yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs uppercase tracking-wider">
                  <th className="text-left pb-3 font-medium">Trip</th>
                  <th className="text-right pb-3 font-medium">Bookings</th>
                  <th className="text-right pb-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topTrips.map(([title, data]) => (
                  <tr key={title}>
                    <td className="py-2.5 pr-3">
                      <p className="text-white font-medium text-xs truncate max-w-[160px]">{title}</p>
                      {data.destination && <p className="text-white/30 text-xs">{data.destination}</p>}
                    </td>
                    <td className="py-2.5 text-right text-white/60 text-xs">{data.bookings}</td>
                    <td className="py-2.5 text-right text-white font-semibold text-xs">€{fmt(data.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* F — Membership breakdown */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-heading font-bold text-white text-base mb-4 flex items-center gap-2">
          <Users size={15} className="text-amber-400" />
          Membership Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { plan: 'basic',   price: 9.99,  label: 'Basic' },
            { plan: 'premium', price: 24.99, label: 'Premium' },
            { plan: 'vip',     price: 39.99, label: 'VIP' },
          ] as const).map(({ plan, price, label }) => (
            <div key={plan} className="bg-white/4 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-2">{label}</p>
              <p className="font-heading text-3xl font-bold text-white">{mCount[plan]}</p>
              <p className="text-white/30 text-xs mt-1">€{price.toFixed(2)} / member</p>
              <p className="text-amber-400 text-xs font-semibold mt-0.5">
                €{fmt(mCount[plan] * price)} total
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* G + H — Recent transactions + Earnings */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Recent transactions */}
        <div className="xl:col-span-3 glass-card rounded-2xl p-6">
          <h3 className="font-heading font-bold text-white text-base mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-brand-primary" />
            Recent Transactions
          </h3>
          <div className="flex flex-col gap-2">
            {recentTx.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-6">No transactions yet</p>
            ) : recentTx.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeColor(tx.type)}`}>
                  {tx.type}
                </span>
                <p className="flex-1 text-white text-xs font-medium truncate">{tx.title}</p>
                <span className="text-white font-semibold text-xs flex-shrink-0">€{fmt(tx.amount)}</span>
                <span className="text-white/30 text-xs flex-shrink-0 tabular-nums">
                  {new Date(tx.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* H — Earnings */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
              <Euro size={15} className="text-green-400" />
              Your Earnings (10%)
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-sm">Platform revenue</span>
                <span className="text-white font-semibold">€{fmt(totalRevenue)}</span>
              </div>
              <div className="border-t border-white/8" />
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-sm">Your 10% cut</span>
                <span className="text-green-400 font-bold text-xl font-heading">€{fmt(earnings10)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-sm">This month</span>
                <span className="text-green-300 font-semibold">€{fmt(earnings10ThisMonth)}</span>
              </div>
            </div>
            <div className="bg-green-500/8 border border-green-500/15 rounded-xl p-3 mt-1">
              <p className="text-green-400/80 text-xs text-center">
                Based on {totalBookings} confirmed bookings + {mb.length} active memberships
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
