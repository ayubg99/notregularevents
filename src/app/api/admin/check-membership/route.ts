import { NextRequest, NextResponse } from'next/server'
import { createClient } from'@supabase/supabase-js'
import type { Database } from'@/types/database'

// GET /api/admin/check-membership?user_id=xxx
// Diagnostic endpoint — requires service role key in X-Admin-Secret header.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error:'Unauthorized' }, { status: 401 })
  }

  const userId = request.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ error:'user_id query param is required' }, { status: 400 })
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: membership, error: memErr }, { data: profile, error: profErr }] = await Promise.all([
    admin.from('memberships').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('profiles').select('user_id, membership_status').eq('user_id', userId).maybeSingle(),
  ])

  return NextResponse.json({
    membership,
    profile,
    errors: {
      membership: memErr?.message ?? null,
      profile: profErr?.message ?? null,
    },
  })
}
