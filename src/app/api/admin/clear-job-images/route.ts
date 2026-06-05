import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  const { error: jobsErr } = await supabase
    .from('job_listings')
    .update({ company_logo_url: null })
    .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows

  if (jobsErr) return NextResponse.json({ error: 'jobs: ' + jobsErr.message }, { status: 500 })

  const { error: empErr } = await supabase
    .from('employer_accounts')
    .update({ company_logo_url: null })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (empErr) return NextResponse.json({ error: 'employers: ' + empErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
