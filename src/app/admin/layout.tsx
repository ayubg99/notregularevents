import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = { title: 'Admin — Erasmus Vibe' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/admin')

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'admin') redirect('/')

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto ml-60 bg-brand-dark">
        <div className="p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
