import { createClient } from'@/lib/supabase/server'
import { redirect } from'next/navigation'
import PostListingForm from'./PostListingForm'

export default async function PostListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/housing/post')
  }

  return <PostListingForm userId={user.id} />
}
