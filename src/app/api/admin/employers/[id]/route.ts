import { NextRequest, NextResponse } from'next/server'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import type { EmployerAccountUpdate } from'@/types/database'

interface Params { params: Promise<{ id: string }> }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  return u?.role ==='admin' ? user : null
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as EmployerAccountUpdate

  const admin = getAdminClient()
  const { error } = await admin.from('employer_accounts').update(body).eq('id', id)

  if (error) {
    console.error('[api/admin/employers PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
