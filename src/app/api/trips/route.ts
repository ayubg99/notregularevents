import { NextRequest, NextResponse } from 'next/server'
import { getPublishedTrips } from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const category = searchParams.get('category') ?? undefined
  const rawLimit  = searchParams.get('limit')
  const limit     = rawLimit ? Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 100) : 50

  const trips = await getPublishedTrips({ category, limit })
  return NextResponse.json(trips)
}
