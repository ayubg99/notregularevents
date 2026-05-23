'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { ProfileInsert, ProfileUpdate } from '@/types/database'

interface ProfileInput {
  fullName?:    string
  bio?:         string
  nationality?: string
  university?:  string
  instagram?:   string
  whatsapp?:    string
}

export async function updateProfile(input: ProfileInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (input.fullName !== undefined) {
    const { error } = await supabase
      .from('users')
      .update({ full_name: input.fullName })
      .eq('id', user.id)
    if (error) return { success: false, error: error.message }
  }

  const profileFields: ProfileUpdate = {}
  if (input.bio         !== undefined) profileFields.bio         = input.bio
  if (input.nationality !== undefined) profileFields.nationality = input.nationality
  if (input.university  !== undefined) profileFields.university  = input.university
  if (input.instagram   !== undefined) profileFields.instagram   = input.instagram
  if (input.whatsapp    !== undefined) profileFields.whatsapp    = input.whatsapp

  if (Object.keys(profileFields).length > 0) {
    const admin = getAdminClient()
    const { error } = await admin
      .from('profiles')
      .upsert(
        { user_id: user.id, ...profileFields } as ProfileInsert,
        { onConflict: 'user_id' }
      )
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

export async function saveRegistrationProfile(
  userId: string,
  input: { nationality?: string; university?: string }
): Promise<{ success: boolean; error?: string }> {
  const fields: ProfileInsert = { user_id: userId }
  if (input.nationality) fields.nationality = input.nationality
  if (input.university)  fields.university  = input.university

  const admin = getAdminClient()
  const { error } = await admin
    .from('profiles')
    .upsert(fields, { onConflict: 'user_id' })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
