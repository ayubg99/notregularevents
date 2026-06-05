import { getAdminClient } from '@/lib/supabase/admin'
import NewsletterClient from './NewsletterClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Newsletter — Admin' }

export default async function AdminNewsletterPage() {
  const admin = getAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('newsletter_emails')
    .select('id, email, subscribed_at')
    .order('subscribed_at', { ascending: false })

  const subscribers = (data ?? []) as { id: string; email: string; subscribed_at: string }[]

  return <NewsletterClient subscribers={subscribers} />
}
