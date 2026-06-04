import type { Metadata } from'next'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import PostJobClient from'@/components/jobs/PostJobClient'
import EmployerAuthPrompt from'@/components/jobs/EmployerAuthPrompt'

export const metadata: Metadata = {
  title:'Post a Job | Erasmus Life',
  description:'Reach international students and young professionals in Valencia. Post your job for free.',
}

export default async function PostJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isEmployer = user?.user_metadata?.role ==='employer'

  if (!user || !isEmployer) {
    return <EmployerAuthPrompt />
  }

  const admin = getAdminClient()
  const { data: employer } = await admin
    .from('employer_accounts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!employer) {
    return <EmployerAuthPrompt />
  }

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Post a Job 
          </h1>
          <p className="text-white/60 text-base max-w-lg mx-auto">
            Reach international students and professionals in Valencia. Free listings are active for 30 days.
          </p>
        </div>
        <PostJobClient employerId={employer.id} />
      </div>
    </main>
  )
}
