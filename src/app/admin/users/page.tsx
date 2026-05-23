export const dynamic = 'force-dynamic'

import { getAdminClient } from '@/lib/supabase/admin'
import MembersClient, { type MemberRow } from './MembersClient'

export default async function AdminUsersPage() {
  const admin = getAdminClient()

  const [
    { data: users, error: usersError },
    { data: profiles },
    { data: memberships },
  ] = await Promise.all([
    admin.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }),
    admin.from('profiles').select('user_id, nationality, university'),
    admin.from('memberships').select('user_id, plan, status'),
  ])

  let authUsers: { id: string; last_sign_in_at?: string }[] = []
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    authUsers = data?.users ?? []
  } catch { /* non-fatal: last active column will show — */ }

  if (usersError) {
    return <div className="p-10 text-red-400">Error loading members: {usersError.message}</div>
  }

  const rows: MemberRow[] = (users ?? []).map(u => ({
    ...u,
    nationality:       profiles?.find(p => p.user_id === u.id)?.nationality ?? null,
    university:        profiles?.find(p => p.user_id === u.id)?.university ?? null,
    membership_plan:   memberships?.find(m => m.user_id === u.id)?.plan ?? null,
    membership_status: memberships?.find(m => m.user_id === u.id)?.status ?? null,
    last_sign_in:      authUsers.find(a => a.id === u.id)?.last_sign_in_at ?? null,
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Members</h1>
          <p className="text-white/40 text-sm mt-0.5">{rows.length} registered members</p>
        </div>
      </div>
      <MembersClient rows={rows} />
    </>
  )
}
