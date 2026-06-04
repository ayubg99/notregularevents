'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole } from '@/app/actions/admin'
import type { UserRole } from '@/types/database'

const ROLES: UserRole[] = ['student', 'ambassador', 'admin']

interface Props {
  userId:      string
  currentRole: string
}

export default function UserRoleSelect({ userId, currentRole }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole
    startTransition(async () => {
      await updateUserRole(userId, role)
      router.refresh()
    })
  }

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs rounded-lg border border-white/15 bg-white/5 text-white px-2 py-1.5 focus:outline-none focus:border-brand-primary/50 transition-colors disabled:opacity-50 [&>option]:bg-brand-dark"
    >
      {ROLES.map(r => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  )
}
