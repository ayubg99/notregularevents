export const dynamic ='force-dynamic'

import { getAdminClient } from'@/lib/supabase/admin'
import MembersClient, { type MemberRow } from'./MembersClient'

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

  if (usersError) {
    return <div className="p-10 text-red-400">Error loading members: {usersError.message}</div>
  }

  let authUsers: { id: string; email?: string; last_sign_in_at?: string; created_at: string; user_metadata?: Record<string, unknown> }[] = []
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    authUsers = data?.users ?? []
  } catch { /* non-fatal */ }

  // Use authUsers as authoritative list when available; fall back to public.users
  const baseList = authUsers.length > 0
    ? authUsers
    : (users ?? []).map(u => ({ ...u, user_metadata: undefined as undefined, last_sign_in_at: undefined as string | undefined }))

  const rows: MemberRow[] = baseList.map(authUser => {
    const u = users?.find(u => u.id === authUser.id)
    const profile = profiles?.find(p => p.user_id === authUser.id)
    const membership = memberships?.find(m => m.user_id === authUser.id)
    return {
      id: authUser.id,
      email: authUser.email ?? u?.email ??'—',
      full_name: u?.full_name ?? (authUser.user_metadata?.full_name as string | undefined) ?? null,
      role: u?.role ??'student',
      created_at: u?.created_at ?? authUser.created_at,
      nationality: profile?.nationality ?? null,
      university: profile?.university ?? null,
      membership_plan: membership?.plan ?? null,
      membership_status: membership?.status ?? null,
      last_sign_in: authUser.last_sign_in_at ?? null,
    }
  })

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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
