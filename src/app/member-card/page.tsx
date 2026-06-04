export const dynamic ='force-dynamic'

import { redirect } from'next/navigation'
import QRCode from'qrcode'
import { createClient } from'@/lib/supabase/server'
import MemberCardClient from'./MemberCardClient'
import type { MembershipRow, ProfileRow, UserRow } from'@/types/database'

export default async function MemberCardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/member-card')

  const [
    { data: userRow },
    { data: profile },
    { data: membership },
  ] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('profiles').select('nationality, university').eq('user_id', user.id).single(),
    supabase.from('memberships').select('*').eq('user_id', user.id).eq('status','active').maybeSingle(),
  ])

  if (!membership) redirect('/membership')

  const displayName =
    (userRow as Pick<UserRow,'full_name'> | null)?.full_name ??
    user.email?.split('@')[0] ??
'Student'

  const qrCodeUrl = await QRCode.toDataURL(
`ERASMUSLIFE-${user.id.slice(0, 8).toUpperCase()}`,
    { width: 200, margin: 1, color: { dark:'#1A1A0E', light:'#FFF8E8' } },
  )

  return (
    <MemberCardClient
      membership={membership as MembershipRow}
      displayName={displayName}
      nationality={(profile as ProfileRow | null)?.nationality ?? null}
      university={(profile as ProfileRow | null)?.university ?? null}
      qrCodeUrl={qrCodeUrl}
    />
  )
}
