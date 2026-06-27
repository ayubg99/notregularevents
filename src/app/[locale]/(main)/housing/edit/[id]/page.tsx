import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditListingForm from './EditListingForm'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: listing } = await supabase
    .from('housing_listings')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!listing) {
    redirect('/dashboard')
  }

  return <EditListingForm listing={listing} userId={user.id} />
}
