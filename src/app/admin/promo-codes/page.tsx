export const dynamic = 'force-dynamic'

import { getAdminClient } from '@/lib/supabase/admin'
import PromoCodesClient from './PromoCodesClient'

export default async function AdminPromoCodesPage() {
  const admin = getAdminClient()
  const { data: promoCodes } = await admin
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return <PromoCodesClient promoCodes={promoCodes ?? []} />
}
