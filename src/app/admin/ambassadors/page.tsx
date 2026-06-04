export const dynamic ='force-dynamic'

import { getAdminClient } from'@/lib/supabase/admin'
import AmbassadorsClient from'./AmbassadorsClient'
import type { AmbassadorApplicationRow, AmbassadorRow } from'@/types/database'

type AmbassadorWithUser = AmbassadorRow & {
  user_email: string | null
  user_name: string | null
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminAmbassadorsPage({ searchParams }: PageProps) {
  const { tab ='applications' } = await searchParams
  const admin = getAdminClient()

  const [
    { data: applicationsRaw },
    { data: ambassadorsRaw },
    { data: usersRaw },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('ambassador_applications').select('*').order('created_at', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('ambassadors').select('*').eq('status','active').order('total_referrals', { ascending: false }),
    admin.from('users').select('id, email, full_name'),
  ])

  const applications = (applicationsRaw ?? []) as AmbassadorApplicationRow[]
  const ambassadors = ((ambassadorsRaw ?? []) as AmbassadorRow[]).map(amb => {
    const user = (usersRaw ?? []).find((u: { id: string; email: string; full_name: string | null }) => u.id === amb.user_id)
    return {
      ...amb,
      user_email: user?.email ?? null,
      user_name: user?.full_name ?? null,
    } as AmbassadorWithUser
  })

  const pendingCount = applications.filter(a => a.status ==='pending').length

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Ambassadors</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {pendingCount} pending application{pendingCount !== 1 ?'s' :''} · {ambassadors.length} active ambassador{ambassadors.length !== 1 ?'s' :''}
          </p>
        </div>
      </div>
      <AmbassadorsClient
        applications={applications}
        ambassadors={ambassadors}
        tab={tab}
      />
    </>
  )
}
