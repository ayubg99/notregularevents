import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

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

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin     = getAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const startOfMonth  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const now           = new Date().toISOString()

  const [
    { count: totalEventTickets },
    { count: activeMembers },
    { count: upcomingEvents },
    { data: recentTickets },
  ] = await Promise.all([
    admin.from('event_tickets').select('*', { count: 'exact', head: true }),
    admin.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('date', now),
    admin.from('event_tickets').select('created_at').gte('created_at', thirtyDaysAgo),
  ])

  // Approximate revenue this month from event prices
  const { data: monthTickets } = await admin.from('event_tickets')
    .select('events(price)')
    .gte('created_at', startOfMonth)
    .not('status', 'eq', 'refunded')

  const eventRevenue = (monthTickets ?? []).reduce((sum, t) => {
    const ev = t.events as unknown as { price: number } | null
    return sum + (ev?.price ?? 0)
  }, 0)

  return NextResponse.json({
    totalEventTickets:  totalEventTickets  ?? 0,
    activeMembers:      activeMembers      ?? 0,
    upcomingEvents:     upcomingEvents     ?? 0,
    revenueThisMonth:   Math.round(eventRevenue * 100) / 100,
    activityLast30Days: groupByDate(recentTickets ?? []),
  })
}
