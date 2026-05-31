'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { runWeeklyDigest } from '@/lib/newsletter'
import type { DigestResult } from '@/lib/newsletter'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') redirect('/')
}

export async function triggerWeeklyDigest(): Promise<DigestResult> {
  await requireAdmin()
  return runWeeklyDigest()
}
