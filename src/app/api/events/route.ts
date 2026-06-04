import { NextRequest, NextResponse } from'next/server'
import { getPublishedEvents } from'@/lib/supabase/queries'
import type { EventCategory } from'@/types/database'

const VALID_CATEGORIES = new Set<string>([
'party','cultural','sport','networking','trip','other',
])

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const rawCategory = searchParams.get('category')
  const rawLimit = searchParams.get('limit')

  const category = rawCategory && VALID_CATEGORIES.has(rawCategory)
    ? (rawCategory as EventCategory)
    : undefined

  const limit = rawLimit ? Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 100) : 50

  const events = await getPublishedEvents({ category, limit })
  return NextResponse.json(events)
}
