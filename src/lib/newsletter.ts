import { getAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'
import { WeeklyDigestEmail } from '@/lib/emails/WeeklyDigestEmail'
import type { DigestEvent } from '@/lib/emails/WeeklyDigestEmail'

export interface DigestResult {
  sent:    number
  skipped: boolean
  reason?: string
}

export async function runWeeklyDigest(): Promise<DigestResult> {
  const admin   = getAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://erasmuslifevalencia.com'
  const from    = process.env.RESEND_FROM_EMAIL   ?? 'bookings@erasmuslifevalencia.com'

  const now      = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const weekLabel = `${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}–${nextWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  const subject   = `🎉 This week at Erasmus Life — ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`

  const [eventsRes, subsRes] = await Promise.all([
    admin.from('events')
      .select('title, slug, date, location, price, is_free, image_url')
      .eq('status', 'published')
      .gte('date', now.toISOString())
      .lte('date', nextWeek.toISOString())
      .order('date', { ascending: true }),
    // newsletter_emails is not in generated types yet — cast needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('newsletter_emails').select('email, unsubscribe_token'),
  ])

  const events      = (eventsRes.data ?? []) as DigestEvent[]
  const subscribers = (subsRes.data   ?? []) as { email: string; unsubscribe_token: string }[]

  if (!events.length) {
    return { sent: 0, skipped: true, reason: 'No published events this week' }
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
