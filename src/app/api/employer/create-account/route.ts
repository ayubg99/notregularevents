import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      user_id:      string
      company_name: string
      contact_name: string
      email:        string
      phone?:       string | null
      website?:     string | null
    }

    if (!body.user_id || !body.company_name || !body.email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { error } = await admin.from('employer_accounts').insert({
      user_id:      body.user_id,
      company_name: body.company_name,
      contact_name: body.contact_name,
      email:        body.email,
      phone:        body.phone        ?? null,
      website:      body.website      ?? null,
    })

    if (error) {
      console.error('[api/employer/create-account]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/employer/create-account] unhandled:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
