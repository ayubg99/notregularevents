import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ valid: false, error: 'Please log in to apply a promo code.' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const code     = searchParams.get('code')
  const price    = parseFloat(searchParams.get('price') ?? '0')
  const quantity = parseInt(searchParams.get('quantity') ?? '1', 10)

  if (!code) {
    return NextResponse.json({ valid: false, error: 'No code provided.' }, { status: 400 })
  }

  const { data: promo } = await supabase
    .from('promo_codes')
    .select('id, discount_type, discount_value, expires_at, uses_remaining')
    .ilike('code', code)
    .single()

  if (!promo) {
    return NextResponse.json({ valid: false, error: 'Promo code not found.' })
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'This promo code has expired.' })
  }

  if (promo.uses_remaining !== null && promo.uses_remaining <= 0) {
    return NextResponse.json({ valid: false, error: 'This promo code has no uses remaining.' })
  }

  const unitPrice = promo.discount_type === 'percentage'
    ? price * (1 - promo.discount_value / 100)
    : price - promo.discount_value

  const discountedUnit  = Math.max(0, unitPrice)
  const discountedTotal = discountedUnit * quantity

  const discountLabel = promo.discount_type === 'percentage'
    ? `${promo.discount_value}% off`
    : `€${promo.discount_value.toFixed(2)} off per ticket`

  return NextResponse.json({
    valid:          true,
    discountedUnit,
    discountedTotal,
    discountLabel,
  })
}
