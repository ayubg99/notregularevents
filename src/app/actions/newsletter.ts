'use server'

import { getAdminClient } from '@/lib/supabase/admin'

type NewsletterResult =
  | { success: true }
  | { success: false; error: string }

export async function subscribeToNewsletter(email: string): Promise<NewsletterResult> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    const admin = getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('newsletter_emails')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

    if (error) {
      console.error('[newsletter] subscribe error:', error.message)
      return { success: false, error: 'Something went wrong. Please try again.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[newsletter] unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
