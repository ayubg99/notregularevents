import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST() {
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

  const { data: existing } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'nre_stripe_account_id')
    .single()

  let accountId = existing?.value

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'https://notregularevents.com'

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'ES',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: 'Not Regular Events',
        url: baseUrl,
        product_description:
          'Nightlife events, guestlist parties and club nights in Madrid',
      },
    })

    accountId = account.id

    await adminClient
      .from('platform_settings')
      .update({
        value: accountId,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'nre_stripe_account_id')
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/admin/stripe?refresh=true`,
    return_url: `${baseUrl}/admin/stripe?success=true`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ onboardingUrl: accountLink.url, accountId })
}
