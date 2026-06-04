import { NextResponse } from'next/server'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  const { data: employer } = await admin
    .from('employer_accounts')
    .select('id, company_name, plan, plan_expires_at')
    .eq('user_id', user.id)
    .single()

  if (!employer) return NextResponse.json({ error:'No employer account' }, { status: 404 })

  return NextResponse.json(employer)
}
