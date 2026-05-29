import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { JobListingUpdate } from '@/types/database'

interface Params { params: Promise<{ id: string }> }

const EDITABLE_FIELDS = new Set([
  'title', 'description', 'requirements', 'salary_text',
  'hours_per_week', 'location', 'language_required',
  'apply_email', 'apply_whatsapp', 'apply_url', 'contact_name', 'status',
])

async function verifyOwnership(jobId: string, userId: string | null, token: string | null): Promise<boolean> {
  const admin = getAdminClient()
  const { data: job } = await admin
    .from('job_listings')
    .select('posted_by_user_id, management_token')
    .eq('id', jobId)
    .single()
  if (!job) return false
  return (!!userId && userId === job.posted_by_user_id) ||
         (!!token  && token  === job.management_token)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  const body = await request.json() as Record<string, unknown> & { token?: string }
  const { token, ...rawFields } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const allowed = await verifyOwnership(id, user?.id ?? null, token ?? null)
  if (!allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Whitelist editable fields
  const update: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rawFields)) {
    if (EDITABLE_FIELDS.has(k)) update[k] = v
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided.' }, { status: 400 })
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

  const body = await request.json() as { token?: string }
  const { token } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const allowed = await verifyOwnership(id, user?.id ?? null, token ?? null)
  if (!allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const admin = getAdminClient()
  const { error } = await admin.from('job_listings').delete().eq('id', id)

  if (error) {
    console.error('[api/jobs DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
