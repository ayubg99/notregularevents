import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import ReviewsClient from './ReviewsClient'
import type { TestimonialRow } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin/reviews')

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') redirect('/')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-white/40 text-sm mt-1">Manage community testimonials shown on the site</p>
        </div>
      </div>
      {error ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-red-400 text-sm">Could not load testimonials: {error.message}</p>
        </div>
      ) : (
        <ReviewsClient items={(data ?? []) as TestimonialRow[]} />
      )}
    </div>
  )
}
