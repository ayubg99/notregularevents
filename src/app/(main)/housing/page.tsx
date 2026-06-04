import type { Metadata } from'next'
import { createClient } from'@/lib/supabase/server'
import { getAdminClient } from'@/lib/supabase/admin'
import HousingTabs from'./HousingTabs'
import type { PartnerRoomRow } from'@/types/database'

export const metadata: Metadata = {
  title:'Housing Board | Erasmus Life',
  description:'Find rooms and roommates in Valencia with fellow Erasmus students.',
}

export default async function HousingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let hasMembership = false
  if (user) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('status, end_date')
      .eq('user_id', user.id)
      .eq('status','active')
      .maybeSingle()
    hasMembership =
      !!membership &&
      (membership.end_date === null || new Date(membership.end_date) > new Date())
  }

  const { data: initialListings } = await supabase
    .from('housing_listings')
    .select('*')
    .eq('status','active')
    .gt('expires_at', new Date().toISOString())
    .eq('type','room_available')
    .order('created_at', { ascending: false })

  const adminClient = getAdminClient()
  const { data: partnerRooms } = await adminClient
    .from('partner_rooms')
    .select('*, housing_partners(name, logo_url)')
    .eq('status','available')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false }) as unknown as { data: PartnerRoomRow[] | null }

  return (
    <main className="min-h-screen pt-24 pb-28 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Find Your Room in Valencia 
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Rooms posted by Erasmus students and verified partner landlords. Find your home before you arrive.
          </p>
        </div>

        <HousingTabs
          partnerRooms={partnerRooms ?? []}
          initialListings={initialListings ?? []}
          hasMembership={hasMembership}
          isLoggedIn={!!user}
        />
      </div>
    </main>
  )
}
