export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostListingForm from './PostListingForm'

export const metadata: Metadata = {
  title: 'Sell Something | Erasmus Vibe Marketplace',
}

export default async function PostListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/marketplace/post')

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }}>
            Sell Something 🛍️
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            Free to list. Members can contact you directly.
          </p>
        </div>
        <PostListingForm userId={user.id} />
      </div>
    </main>
  )
}
