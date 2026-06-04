import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
  if (!code) return NextResponse.json({ valid: false }, { status: 400 })

  const admin = getAdminClient()
  const { data } = await admin
    .from('ambassadors')
    .select('id, referral_code')
    .eq('referral_code', code)
    .eq('status', 'active')
    .single()

  if (!data) return NextResponse.json({ valid: false })
  return NextResponse.json({ valid: true, id: data.id, referral_code: data.referral_code })
}
