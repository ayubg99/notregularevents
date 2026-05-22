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
    { count: totalTripBookings },
    { count: activeMembers },
    { count: upcomingEvents },
    { data: recentTickets },
    { data: recentTripBookings },
  ] = await Promise.all([
    admin.from('event_tickets').select('*', { count: 'exact', head: true }),
    admin.from('trip_bookings').select('*', { count: 'exact', head: true }),
    admin.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('date', now),
    admin.from('event_tickets').select('created_at').gte('created_at', thirtyDaysAgo),
    admin.from('trip_bookings').select('created_at').gte('created_at', thirtyDaysAgo),
  ])

  // Approximate revenue this month from event prices
  const [
    { data: monthTickets },
    { data: monthTripBookings },
  ] = await Promise.all([
    admin.from('event_tickets')
      .select('events(price)')
      .gte('created_at', startOfMonth)
      .not('status', 'eq', 'refunded'),
    admin.from('trip_bookings')
      .select('tier, trips(price_standard, price_early_bird, price_vip, price_group)')
      .gte('created_at', startOfMonth)
      .not('status', 'eq', 'refunded'),
  ])

  const eventRevenue = (monthTickets ?? []).reduce((sum, t) => {
    const ev = t.events as unknown as { price: number } | null
    return sum + (ev?.price ?? 0)
  }, 0)

  const tripRevenue = (monthTripBookings ?? []).reduce((sum, b) => {
    const trip = b.trips as unknown as { price_standard: number; price_early_bird: number | null; price_vip: number | null; price_group: number | null } | null
    if (!trip) return sum
    const prices: Record<string, number | null> = {
      standard: trip.price_standard,
      early_bird: trip.price_early_bird,
      vip: trip.price_vip,
      group: trip.price_group,
    }
    return sum + (prices[b.tier] ?? trip.price_standard)
  }, 0)

  const allActivity = [...(recentTickets ?? []), ...(recentTripBookings ?? [])]

  return NextResponse.json({
    totalEventTickets:  totalEventTickets  ?? 0,
    totalTripBookings:  totalTripBookings  ?? 0,
    activeMembers:      activeMembers      ?? 0,
    upcomingEvents:     upcomingEvents     ?? 0,
    revenueThisMonth:   Math.round((eventRevenue + tripRevenue) * 100) / 100,
    activityLast30Days: groupByDate(allActivity),
  })
}
