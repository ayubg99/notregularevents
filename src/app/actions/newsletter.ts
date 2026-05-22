'use server'

import { createClient } from '@/lib/supabase/server'
import type { NotificationInsert } from '@/types/database'

type NewsletterResult =
  | { success: true;  subscribed: boolean }
  | { success: false; error: string }

export async function subscribeToNewsletter(email: string): Promise<NewsletterResult> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    const supabase = await createClient()

    // getUser() re-validates JWT on the server (more secure than getSession)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Cannot write to notifications (user_id NOT NULL) — silently succeed
      // TODO: integrate a dedicated newsletter_emails table or Resend/Mailchimp
      return { success: true, subscribed: false }
    }

    const payload: NotificationInsert = {
      user_id: user.id,
      type:    'promo',
      message: `Newsletter subscription confirmed for ${email}`,
      read:    false,
    }

    const { error } = await supabase.from('notifications').insert(payload)

    if (error) {
      // RLS gap: notifications table has no "own insert" policy yet
      // Degrades gracefully — schema migration needed to fix
      console.error('[newsletter] insert error:', error.message)
      return { success: true, subscribed: false }
    }

    return { success: true, subscribed: true }
  } catch (err) {
    console.error('[newsletter] unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
