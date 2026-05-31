import { getAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'
import { WeeklyDigestEmail } from '@/lib/emails/WeeklyDigestEmail'
import type { DigestEvent, DigestTrip } from '@/lib/emails/WeeklyDigestEmail'

export interface DigestResult {
  sent:    number
  skipped: boolean
  reason?: string
}

export async function runWeeklyDigest(): Promise<DigestResult> {
  const admin   = getAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmusvibe.com'
  const from    = process.env.RESEND_FROM_EMAIL   ?? 'bookings@erasmusvibe.com'

  const now      = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const weekLabel = `${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}–${nextWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  const subject   = `🎉 This week at Erasmus Vibe — ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`

  const [eventsRes, tripsRes, subsRes] = await Promise.all([
    admin.from('events')
      .select('title, slug, date, location, price, is_free, image_url')
      .eq('status', 'published')
      .gte('date', now.toISOString())
      .lte('date', nextWeek.toISOString())
      .order('date', { ascending: true }),
    admin.from('trips')
      .select('title, slug, start_date, end_date, destination, price_standard, image_url')
      .eq('status', 'published')
      .gte('start_date', now.toISOString())
      .lte('start_date', nextWeek.toISOString())
      .order('start_date', { ascending: true }),
    // newsletter_emails is not in generated types yet — cast needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('newsletter_emails').select('email, unsubscribe_token'),
  ])

  const events      = (eventsRes.data ?? []) as DigestEvent[]
  const trips       = (tripsRes.data  ?? []) as DigestTrip[]
  const subscribers = (subsRes.data   ?? []) as { email: string; unsubscribe_token: string }[]

  if (!events.length && !trips.length) {
    return { sent: 0, skipped: true, reason: 'No published events or trips this week' }
  }
  if (!subscribers.length) {
    return { sent: 0, skipped: false, reason: 'No subscribers yet' }
  }

  const BATCH = 100
  let sent = 0

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const slice = subscribers.slice(i, i + BATCH)
    const batch = slice.map(sub => ({
      from,
      to:      sub.email,
      subject,
      html: WeeklyDigestEmail({
        events,
        trips,
        baseUrl,
        unsubscribeUrl: `${baseUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`,
        weekLabel,
      }),
    }))

    try {
      const { error } = await getResend().batch.send(batch)
      if (error) console.error('[newsletter] batch error:', error)
      else sent += batch.length
    } catch (err) {
      console.error('[newsletter] batch failed:', err)
    }
  }

  return { sent, skipped: false }
}
