import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'https://erasmuslifevalencia.com'

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'ES',
    capabilities: {
      card_payments: { requested: true },
      transfers:     { requested: true },
    },
    business_type: 'company',
    business_profile: {
      name:                'Erasmus Life Valencia',
      url:                 baseUrl,
      product_description: 'Student events, trips and activities for international students in Valencia',
    },
  })

  console.log('Connected account created:', account.id)
  console.log('Add to env: ERASMUS_VIBE_STRIPE_ACCOUNT_ID=', account.id)

  const accountLink = await stripe.accountLinks.create({
    account:     account.id,
    refresh_url: `${baseUrl}/admin`,
    return_url:  `${baseUrl}/admin`,
    type:        'account_onboarding',
  })

  return NextResponse.json({
    accountId:     account.id,
    onboardingUrl: accountLink.url,
  })
}
