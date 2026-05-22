'use server'

import { createClient } from '@/lib/supabase/server'

interface AmbassadorInput {
  name:       string
  email:      string
  university: string
  instagram?: string
  why_join:   string
}

export async function submitAmbassadorApplication(input: AmbassadorInput): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim())       return { success: false, error: 'Full name is required.' }
  if (!input.university.trim()) return { success: false, error: 'University is required.' }
  if (input.why_join.trim().length < 50) return { success: false, error: 'Please write at least 50 characters about why you want to join.' }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(input.email)) return { success: false, error: 'Please enter a valid email address.' }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ambassador_applications')
    .insert({
      name:       input.name.trim(),
      email:      input.email.trim().toLowerCase(),
      university: input.university.trim(),
      instagram:  input.instagram?.trim() || null,
      why_join:   input.why_join.trim(),
      status:     'pending',
    })

  if (error) {
    console.error('[ambassador apply]', error.message)
    return { success: false, error: 'Failed to submit application. Please try again.' }
  }

  return { success: true }
}
