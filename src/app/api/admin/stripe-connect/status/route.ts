import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = getAdminClient()

  const { data: setting } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'nre_stripe_account_id')
    .single()

  if (!setting?.value) {
    return NextResponse.json({ connected: false })
  }

  try {
    const account = await stripe.accounts.retrieve(setting.value)

    const isActive =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled

    await adminClient
      .from('platform_settings')
      .upsert(
        {
          key: 'nre_stripe_account_status',
          value: isActive ? 'active' : 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )

    return NextResponse.json({
      connected: true,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      status: isActive ? 'active' : 'pending',
    })
  } catch {
    return NextResponse.json({ connected: false, error: 'Could not retrieve account' })
  }
}
