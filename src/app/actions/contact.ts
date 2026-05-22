'use server'

import { createClient } from '@/lib/supabase/server'

interface ContactInput {
  name:    string
  email:   string
  subject: string
  message: string
}

export async function submitContact(input: ContactInput): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim())    return { success: false, error: 'Name is required.' }
  if (!input.subject.trim()) return { success: false, error: 'Subject is required.' }
  if (input.message.trim().length < 20) return { success: false, error: 'Message must be at least 20 characters.' }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(input.email)) return { success: false, error: 'Please enter a valid email address.' }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('contact_messages')
    .insert({
      name:    input.name.trim(),
      email:   input.email.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim(),
    })

  if (error) {
    console.error('[contact submit]', error.message)
    return { success: false, error: 'Failed to send message. Please try again.' }
  }

  return { success: true }
}
