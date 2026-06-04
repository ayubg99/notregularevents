import { NextRequest, NextResponse } from'next/server'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import type { PromoCodeInsert } from'@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !=='admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error:'Forbidden' }, { status: 403 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error:'Forbidden' }, { status: 403 })

  const body = await req.json() as PromoCodeInsert

  if (!body.code || !body.discount_type || body.discount_value == null) {
    return NextResponse.json({ error:'Missing required fields' }, { status: 400 })
  }
  if (!/^[A-Z0-9]+$/.test(body.code)) {
    return NextResponse.json({ error:'Code must contain only uppercase letters and numbers' }, { status: 400 })
  }
  if (body.discount_value <= 0) {
    return NextResponse.json({ error:'Discount value must be greater than 0' }, { status: 400 })
  }
  if (body.discount_type ==='percentage' && body.discount_value > 100) {
    return NextResponse.json({ error:'Percentage discount cannot exceed 100' }, { status: 400 })
  }

  const admin = getAdminClient()

  const { data: existing } = await admin
    .from('promo_codes')
    .select('id')
    .ilike('code', body.code)
    .single()

  if (existing) {
    return NextResponse.json({ error:'A promo code with this name already exists' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('promo_codes')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
