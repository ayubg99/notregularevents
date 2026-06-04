import { NextRequest, NextResponse } from'next/server'
import { getEventBySlug } from'@/lib/supabase/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    return NextResponse.json({ error:'Event not found' }, { status: 404 })
  }

  return NextResponse.json(event)
}
