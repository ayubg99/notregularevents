'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import type { EventInsert, EventUpdate, TripInsert, TripUpdate, UserRole } from '@/types/database'

async function verifyAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized' }
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') return { ok: false, error: 'Forbidden' }
  return { ok: true, userId: user.id }
}

// ── Events ────────────────────────────────────────────────────

export async function createEvent(data: EventInsert): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('events').insert({ ...data, created_by: auth.userId })
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

export async function updateEvent(id: string, data: EventUpdate): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('events').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('events').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

// ── Trips ─────────────────────────────────────────────────────

export async function createTrip(data: TripInsert): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('trips').insert({ ...data, created_by: auth.userId })
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/trips')
  revalidatePath('/trips')
  return { success: true }
}

export async function updateTrip(id: string, data: TripUpdate): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('trips').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/trips')
  revalidatePath('/trips')
  return { success: true }
}

export async function deleteTrip(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('trips').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/trips')
  revalidatePath('/trips')
  return { success: true }
}

// ── Users ─────────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('users').update({ role }).eq('id', userId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}
