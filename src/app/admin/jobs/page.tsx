import { getAdminClient } from'@/lib/supabase/admin'
import JobsAdminClient from'./JobsAdminClient'

export default async function AdminJobsPage() {
  const admin = getAdminClient()
  const { data: jobs } = await admin
    .from('job_listings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Job Listings</h1>
      <JobsAdminClient jobs={jobs ?? []} />
    </div>
  )
}
