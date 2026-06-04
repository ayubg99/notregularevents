'use server'

import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import { sendAmbassadorApprovalEmail } from'@/lib/email'

interface AmbassadorInput {
  name: string
  email: string
  university: string
  instagram?: string
  why_join: string
}

export async function submitAmbassadorApplication(input: AmbassadorInput): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim()) return { success: false, error:'Full name is required.' }
  if (!input.university.trim()) return { success: false, error:'University is required.' }
  if (input.why_join.trim().length < 50) return { success: false, error:'Please write at least 50 characters about why you want to join.' }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(input.email)) return { success: false, error:'Please enter a valid email address.' }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ambassador_applications')
    .insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      university: input.university.trim(),
      instagram: input.instagram?.trim() || null,
      why_join: input.why_join.trim(),
      status:'pending',
    })

  if (error) {
    console.error('[ambassador apply]', error.message)
    return { success: false, error:'Failed to submit application. Please try again.' }
  }

  return { success: true }
}

function generateReferralCode(name: string): string {
  const prefix = name.toUpperCase().replace(/[^A-Z]/g,'').slice(0, 4).padEnd(4,'X')
  const suffix = Math.floor(1000 + Math.random() * 9000).toString()
  return`${prefix}${suffix}`
}

export async function approveAmbassadorApplication(
  applicationId: string,
  name: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient()

  // Find user by email
  const { data: user } = await admin.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle()
  if (!user) {
    return { success: false, error:'No account found for this email. The applicant must create an account first.' }
  }

  const referralCode = generateReferralCode(name)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ??'https://erasmuslifevalencia.com'
  const referralLink =`${baseUrl}?ref=${referralCode}`

  // Create ambassador record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: ambErr } = await (admin as any).from('ambassadors').insert({
    user_id: user.id,
    referral_code: referralCode,
    status:'active',
    commission_rate: 5,
    total_referrals: 0,
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
  })
  if (ambErr) {
    console.error('[approve ambassador]', ambErr.message)
    return { success: false, error:'Failed to create ambassador record.' }
  }

  // Update user role
  await admin.from('users').update({ role:'ambassador' }).eq('id', user.id)

  // Mark application approved
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('ambassador_applications').update({ status:'approved' }).eq('id', applicationId)

  // Send approval email
  await sendAmbassadorApprovalEmail({ to: email, name, referralCode, referralLink, commissionRate: 5 })

  return { success: true }
}

export async function rejectAmbassadorApplication(
  applicationId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('ambassador_applications').update({ status:'rejected' }).eq('id', applicationId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function markAmbassadorPaid(
  ambassadorId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: amb } = await (admin as any).from('ambassadors').select('pending_earnings, paid_earnings').eq('id', ambassadorId).single()
  if (!amb) return { success: false, error:'Ambassador not found.' }

  const newPaid = ((amb.paid_earnings as number) ?? 0) + ((amb.pending_earnings as number) ?? 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: ambErr } = await (admin as any)
    .from('ambassadors')
    .update({ pending_earnings: 0, paid_earnings: newPaid })
    .eq('id', ambassadorId)
  if (ambErr) return { success: false, error: ambErr.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('ambassador_commissions')
    .update({ status:'paid', paid_at: new Date().toISOString() })
    .eq('ambassador_id', ambassadorId)
    .eq('status','pending')

  return { success: true }
}

export async function updateAmbassadorCommissionRate(
  ambassadorId: string,
  rate: number,
): Promise<{ success: boolean; error?: string }> {
  if (rate < 0 || rate > 100) return { success: false, error:'Rate must be between 0 and 100.' }
  const admin = getAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('ambassadors').update({ commission_rate: rate }).eq('id', ambassadorId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deactivateAmbassador(
  ambassadorId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('ambassadors').update({ status:'inactive' }).eq('id', ambassadorId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
