import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import EditJobClient from '@/components/jobs/EditJobClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit Job Listing | Erasmus Vibe',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditJobPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/employer/login?redirectTo=/jobs/edit/${id}`)

  const admin = getAdminClient()
  const { data: job } = await admin
    .from('job_listings')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  if (job.posted_by_user_id !== user.id) {
    redirect(`/jobs/${id}`)
  }

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Job Listing</h1>
          <p className="text-white/50 text-sm">Changes take effect immediately.</p>
        </div>
        <EditJobClient job={job} token={null} />
      </div>
    </main>
  )
}
