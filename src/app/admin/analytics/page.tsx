import { BarChart2, Ticket, TrendingUp, DollarSign, Calendar, Users } from 'lucide-react'
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
    { data: rawMemberships },
  ] = await Promise.all([
    admin
      .from('event_tickets')
      .select('amount_paid, created_at, status, events(title, category)')
      .in('status', ['active', 'used'])
      .order('created_at', { ascending: true }),
    admin
      .from('memberships')
      .select('plan, status, created_at, start_date')
      .eq('status', 'active'),
  ])

  const eb = (rawEventBookings as unknown as EventTicketRow[] | null) ?? []
  const mb = (rawMemberships as unknown as MembershipRow[] | null) ?? []

  // ── Combined revenue entries ──
  type RevenueEntry = { amount: number; type: 'Event' | 'Membership'; title: string; created_at: string }
  const allRevenue: RevenueEntry[] = [
    ...eb.map(b => ({
      amount: b.amount_paid ?? 0,
      type: 'Event' as const,
      title: b.events?.title ?? 'Unknown event',
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

  const eventRevenue      = eb.reduce((s, b) => s + (b.amount_paid ?? 0), 0)
  const membershipRevenue = mb.reduce((s, m) => s + getMembershipPrice(m.plan), 0)

  const totalBookings = eb.length
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

  // ── Membership breakdown ──
  const mCount = { basic: 0, premium: 0, vip: 0 }
  for (const m of mb) {
    if (m.plan in mCount) mCount[m.plan as keyof typeof mCount]++
  }

  // ── Recent transactions (last 10) ──
  const recentTx = [...allRevenue]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  const badgeColor = (type: string) => {
    if (type === 'Event') return 'bg-brand-primary/20 text-brand-primary'
    return 'bg-orange-500/20 text-orange-400'
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Revenue Analytics</h1>
        <p className="text-white/40 text-sm">Financial overview across events and memberships.</p>
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
          color="bg-orange-500/15"
        />
      </div>

      {/* B — Revenue by type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Events',      revenue: eventRevenue,      sub: `${eb.length} bookings`, icon: <Calendar size={16} />, color: 'text-brand-primary' },
          { label: 'Memberships', revenue: membershipRevenue, sub: `${mb.length} active`,   icon: <Users size={16} />,    color: 'text-orange-400'   },
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

      {/* D — Top events */}
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

      {/* E — Membership breakdown */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-heading font-bold text-white text-base mb-4 flex items-center gap-2">
          <Users size={15} className="text-orange-400" />
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
              <p className="text-orange-400 text-xs font-semibold mt-0.5">
                €{fmt(mCount[plan] * price)} total
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* F — Recent transactions */}
      <div className="glass-card rounded-2xl p-6">
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
    </div>
  )
}
