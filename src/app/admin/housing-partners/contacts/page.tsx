import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import ContactsClient, { type ContactRow } from '../ContactsClient'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/admin/housing-partners/contacts')
  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userRow?.role !== 'admin') redirect('/')

  const admin = getAdminClient()

  const { data: contacts } = await admin
    .from('room_contacts')
    .select('*, partner_rooms(title, neighborhood, monthly_rent), housing_partners(name)')
    .order('created_at', { ascending: false }) as unknown as { data: ContactRow[] | null }

  const rows = contacts ?? []
  const totalEarned = rows.reduce((sum, r) => sum + (r.platform_fee ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/admin/housing-partners" className="hover:text-white transition-colors">Partners</Link>
        <span>/</span>
        <span className="text-white/60">Contacts</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Room Contacts</h1>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-white/40 text-xs mb-1">Total contacts sold</p>
          <p className="text-3xl font-bold text-white">{rows.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-white/40 text-xs mb-1">Total earned</p>
          <p className="text-3xl font-bold text-brand-accent">€{totalEarned}</p>
        </div>
      </div>

      <ContactsClient rows={rows} />
    </div>
  )
}
