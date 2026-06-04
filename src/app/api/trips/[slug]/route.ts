import { NextRequest, NextResponse } from'next/server'
import { getTripBySlug } from'@/lib/supabase/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const trip = await getTripBySlug(slug)

  if (!trip) {
    return NextResponse.json({ error:'Trip not found' }, { status: 404 })
  }

  return NextResponse.json(trip)
}
