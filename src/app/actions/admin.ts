'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'
import { NewEventAnnouncementEmail, NewTripAnnouncementEmail } from '@/lib/emails/AnnouncementEmail'
import { confirmBooking, rejectBooking } from '@/lib/booking-utils'
import type {
  EventInsert, EventUpdate, TripInsert, TripUpdate, UserRole, HousingStatus,
  HousingPartnerInsert, HousingPartnerUpdate, HousingPartnerStatus,
  PartnerRoomInsert, PartnerRoomUpdate, PartnerRoomStatus,
  RoomContactStatus, SponsorInsert, SponsorUpdate,
  PartyRecapMediaInsert, PartyRecapMediaUpdate,
} from '@/types/database'

type Subscriber = { email: string; unsubscribe_token: string }

async function fetchSubscribers(): Promise<Subscriber[]> {
  const admin = getAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).from('newsletter_emails').select('email, unsubscribe_token')
  return (data ?? []) as Subscriber[]
}

async function batchSend(emails: Parameters<ReturnType<typeof getResend>['batch']['send']>[0]): Promise<number> {
  const BATCH = 100
  let sent = 0
  for (let i = 0; i < emails.length; i += BATCH) {
    try {
      const { error } = await getResend().batch.send(emails.slice(i, i + BATCH))
      if (!error) sent += Math.min(BATCH, emails.length - i)
    } catch { /* non-fatal */ }
  }
  return sent
}

async function verifyAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized' }
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') return { ok: false, error: 'Forbidden' }
  return { ok: true, userId: user.id }
}

// ── Events ────────────────────────────────────────────────────

export async function createEvent(data: EventInsert, notifySubscribers = false): Promise<{ success: boolean; error?: string; notified?: number }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin   = getAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://notregularevents.com'
  const from    = process.env.RESEND_FROM_EMAIL   ?? 'notregularevents@gmail.com'

  const { data: row, error } = await admin
    .from('events')
    .insert({ ...data, created_by: auth.userId })
    .select('title, slug, date, location, price, is_free, image_url')
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/events')
  revalidatePath('/events')

  if (!notifySubscribers) return { success: true }

  const subscribers = await fetchSubscribers()
  if (!subscribers.length) return { success: true, notified: 0 }

  const subject = `🎉 New event: ${row.title}`
  const emails  = subscribers.map(sub => ({
    from,
    to:      sub.email,
    subject,
    html: NewEventAnnouncementEmail({
      title:          row.title,
      slug:           row.slug,
      date:           row.date,
      location:       row.location,
      price:          row.price,
      isFree:         row.is_free,
      imageUrl:       row.image_url,
      baseUrl,
      unsubscribeUrl: `${baseUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`,
    }),
  }))

  const notified = await batchSend(emails)
  return { success: true, notified }
}

export async function updateEvent(id: string, data: EventUpdate): Promise<{ success: boolean; error?: string; notified?: number }> {
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

export async function duplicateEvent(eventId: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  const admin = getAdminClient()

  const { data: orig, error: fetchErr } = await admin
    .from('events').select('*').eq('id', eventId).single()
  if (fetchErr || !orig) return { success: false, error: 'Event not found' }

  const { data, error } = await admin
    .from('events')
    .insert({
      title:               `${orig.title} (Copy)`,
      slug:                `${orig.slug}-copy-${Date.now()}`,
      description:         orig.description,
      category:            orig.category,
      date:                orig.date,
      location:            orig.location,
      image_url:           orig.image_url,
      is_free:             orig.is_free,
      members_only_free:   orig.members_only_free,
      price:               orig.price,
      price_early_bird:    orig.price_early_bird,
      price_group:         orig.price_group,
      early_bird_deadline: null,
      early_bird_seats:    orig.early_bird_seats,
      group_min_size:      orig.group_min_size,
      capacity:            orig.capacity,
      city:                orig.city,
      status:              'draft',
      created_by:          auth.userId,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true, id: data.id }
}

// ── Trips ─────────────────────────────────────────────────────

export async function createTrip(data: TripInsert, notifySubscribers = false): Promise<{ success: boolean; error?: string; notified?: number }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin   = getAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://notregularevents.com'
  const from    = process.env.RESEND_FROM_EMAIL   ?? 'notregularevents@gmail.com'

  const { data: row, error } = await admin
    .from('trips')
    .insert({ ...data, created_by: auth.userId })
    .select('title, slug, start_date, end_date, destination, price_standard, image_url')
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/trips')
  revalidatePath('/trips')

  if (!notifySubscribers) return { success: true }

  const subscribers = await fetchSubscribers()
  if (!subscribers.length) return { success: true, notified: 0 }

  const subject = `✈️ New trip: ${row.title}`
  const emails  = subscribers.map(sub => ({
    from,
    to:      sub.email,
    subject,
    html: NewTripAnnouncementEmail({
      title:          row.title,
      slug:           row.slug,
      startDate:      row.start_date,
      endDate:        row.end_date,
      destination:    row.destination,
      priceStandard:  row.price_standard,
      imageUrl:       row.image_url,
      baseUrl,
      unsubscribeUrl: `${baseUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`,
    }),
  }))

  const notified = await batchSend(emails)
  return { success: true, notified }
}

export async function updateTrip(id: string, data: TripUpdate): Promise<{ success: boolean; error?: string; notified?: number }> {
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

export async function duplicateTrip(tripId: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }
  const admin = getAdminClient()

  const { data: orig, error: fetchErr } = await admin
    .from('trips').select('*').eq('id', tripId).single()
  if (fetchErr || !orig) return { success: false, error: 'Trip not found' }

  const { data, error } = await admin
    .from('trips')
    .insert({
      title:               `${orig.title} (Copy)`,
      slug:                `${orig.slug}-copy-${Date.now()}`,
      description:         orig.description,
      category:            orig.category,
      destination:         orig.destination,
      start_date:          orig.start_date,
      end_date:            orig.end_date,
      price_standard:      orig.price_standard,
      price_early_bird:    orig.price_early_bird,
      price_group:         orig.price_group,
      early_bird_deadline: null,
      early_bird_seats:    orig.early_bird_seats,
      group_min_size:      orig.group_min_size,
      capacity:            orig.capacity,
      image_url:           orig.image_url,
      whatsapp_group_url:  orig.whatsapp_group_url,
      itinerary:           orig.itinerary,
      whats_included:      orig.whats_included,
      whats_excluded:      orig.whats_excluded,
      meeting_points:      orig.meeting_points,
      status:              'draft',
      created_by:          auth.userId,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/trips')
  revalidatePath('/trips')
  return { success: true, id: data.id }
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

// ── Housing ───────────────────────────────────────────────────

export async function updateHousingStatus(id: string, status: HousingStatus): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('housing_listings').update({ status }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing')
  return { success: true }
}

export async function deleteHousing(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('housing_listings').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing')
  return { success: true }
}

// ── Housing Partners ──────────────────────────────────────────

export async function createHousingPartner(data: HousingPartnerInsert): Promise<{ success: boolean; id?: string; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { data: row, error } = await admin.from('housing_partners').insert(data).select('id').single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing-partners')
  return { success: true, id: row?.id }
}

export async function updateHousingPartner(id: string, data: HousingPartnerUpdate): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('housing_partners').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing-partners')
  return { success: true }
}

export async function deleteHousingPartner(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('housing_partners').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing-partners')
  return { success: true }
}

export async function togglePartnerStatus(id: string, status: HousingPartnerStatus): Promise<{ success: boolean; error?: string }> {
  return updateHousingPartner(id, { status })
}

// ── Partner Rooms ─────────────────────────────────────────────

export async function createPartnerRoom(data: PartnerRoomInsert): Promise<{ success: boolean; id?: string; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { data: row, error } = await admin.from('partner_rooms').insert(data).select('id').single()
  if (error) return { success: false, error: error.message }

  revalidatePath(`/admin/housing-partners/${data.partner_id}`)
  revalidatePath('/housing')
  return { success: true, id: row?.id }
}

export async function updatePartnerRoom(id: string, data: PartnerRoomUpdate): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('partner_rooms').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing-partners')
  revalidatePath('/housing')
  return { success: true }
}

export async function togglePartnerRoomStatus(id: string, status: PartnerRoomStatus): Promise<{ success: boolean; error?: string }> {
  return updatePartnerRoom(id, { status })
}

export async function deletePartnerRoom(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('partner_rooms').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing-partners')
  revalidatePath('/housing')
  return { success: true }
}

export async function updateRoomContactStatus(id: string, status: RoomContactStatus): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('room_contacts').update({ status }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/housing-partners/contacts')
  return { success: true }
}

// ── Sponsors ──────────────────────────────────────────────────

export async function createSponsor(data: SponsorInsert): Promise<{ success: boolean; id?: string; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { data: row, error } = await admin.from('sponsors').insert(data).select('id').single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/sponsors')
  revalidatePath('/')
  revalidatePath('/membership')
  return { success: true, id: row?.id }
}

export async function updateSponsor(id: string, data: SponsorUpdate): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('sponsors').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/sponsors')
  revalidatePath('/')
  revalidatePath('/membership')
  return { success: true }
}

export async function deleteSponsor(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('sponsors').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/sponsors')
  revalidatePath('/')
  revalidatePath('/membership')
  return { success: true }
}

export async function confirmBookingAdmin(bookingRef: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const result = await confirmBooking(bookingRef)
  if (result.success) revalidatePath('/admin/housing-partners/contacts')
  return result
}

export async function rejectBookingAdmin(bookingRef: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const result = await rejectBooking(bookingRef, 'Rejected by admin')
  if (result.success) revalidatePath('/admin/housing-partners/contacts')
  return { success: result.success, error: result.error }
}

// ── Marketplace ───────────────────────────────────────────────

export async function deactivateMarketplaceListing(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('marketplace_listings').update({ status: 'inactive' }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/marketplace')
  return { success: true }
}

export async function deleteMarketplaceListing(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('marketplace_listings').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/marketplace')
  return { success: true }
}

// ── Party Recap Media ──────────────────────────────────────────

export async function createRecapMedia(data: PartyRecapMediaInsert): Promise<{ success: boolean; id?: string; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { data: row, error } = await admin.from('party_recap_media').insert(data).select('id').single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/recap-media')
  revalidatePath('/')
  return { success: true, id: row?.id }
}

export async function updateRecapMedia(id: string, data: PartyRecapMediaUpdate): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('party_recap_media').update(data).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/recap-media')
  revalidatePath('/')
  return { success: true }
}

export async function deleteRecapMedia(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const admin = getAdminClient()
  const { error } = await admin.from('party_recap_media').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/recap-media')
  revalidatePath('/')
  return { success: true }
}
