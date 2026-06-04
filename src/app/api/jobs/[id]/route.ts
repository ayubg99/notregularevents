import { NextRequest, NextResponse } from'next/server'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import type { JobListingUpdate } from'@/types/database'

interface Params { params: Promise<{ id: string }> }

const EDITABLE_FIELDS = new Set([
'title','description','requirements','salary_text',
'hours_per_week','location','language_required',
'apply_email','apply_whatsapp','apply_url','contact_name','status',
])

async function getOwnerUserId(jobId: string): Promise<string | null> {
  const admin = getAdminClient()
  const { data } = await admin
    .from('job_listings')
    .select('posted_by_user_id')
    .eq('id', jobId)
    .single()
  return data?.posted_by_user_id ?? null
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status: 401 })

  const ownerUserId = await getOwnerUserId(id)
  if (ownerUserId !== user.id) return NextResponse.json({ error:'Forbidden' }, { status: 403 })

  const body = await request.json() as Record<string, unknown>
  const update: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE_FIELDS.has(k)) update[k] = v
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error:'No editable fields provided.' }, { status: 400 })
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from('job_listings')
    .update(update as JobListingUpdate)
    .eq('id', id)

  if (error) {
    console.error('[api/jobs PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status: 401 })

  const ownerUserId = await getOwnerUserId(id)
  if (ownerUserId !== user.id) return NextResponse.json({ error:'Forbidden' }, { status: 403 })

  const admin = getAdminClient()
  const { error } = await admin.from('job_listings').delete().eq('id', id)

  if (error) {
    console.error('[api/jobs DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
