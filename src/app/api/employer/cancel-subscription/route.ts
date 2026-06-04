import { NextResponse } from'next/server'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import { stripe } from'@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data: employer } = await admin
      .from('employer_accounts')
      .select('id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!employer) return NextResponse.json({ error:'Employer account not found.' }, { status: 404 })

    if (employer.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(employer.stripe_subscription_id)
      } catch (e) {
        console.warn('[cancel-subscription] stripe cancel failed:', e)
      }
    }

    await admin
      .from('employer_accounts')
      .update({ plan:'free', stripe_subscription_id: null, plan_expires_at: null })
      .eq('id', employer.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cancel-subscription] unhandled:', err)
    return NextResponse.json({ error:'Server error.' }, { status: 500 })
  }
}
