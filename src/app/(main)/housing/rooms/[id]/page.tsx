import { notFound } from'next/navigation'
import Link from'next/link'
import { getAdminClient } from'@/lib/supabase/admin'
import PhotoGallery from'@/components/housing/PhotoGallery'
import RoomBookingSidebar from'@/components/housing/RoomBookingSidebar'
import type { PartnerRoomRow } from'@/types/database'

export const dynamic ='force-dynamic'

const ROOM_TYPE_LABELS: Record<string, string> = {
  private_room:'Private Room',
  shared_room:'Shared Room',
  studio:'Studio',
  full_apartment:'Full Apartment',
}

const GENDER_LABELS: Record<string, string> = {
  male:'Male only',
  female:'Female only',
  mixed:'Mixed',
  any:'Any gender',
}

const AMENITY_DISPLAY: Record<string, string> = {
  wifi:' WiFi',
  ac:' Air conditioning',
  washing_machine:' Washing machine',
  balcony:' Balcony',
  bills_included:' Bills included',
  furnished:' Furnished',
  private_bathroom:' Private bathroom',
  near_university:' Near university',
  parking:' Parking',
  elevator:' Elevator',
  heating:' Heating',
}

const NATIONALITY_FLAGS: Record<string, string> = {
  Spanish:'', Italian:'', French:'', German:'', Portuguese:'',
  British:'', Dutch:'', Polish:'', American:'', Brazilian:'',
  Mexican:'', Chinese:'', Japanese:'', Korean:'', Indian:'',
  Turkish:'', Romanian:'', Bulgarian:'', Ukrainian:'', Swedish:'',
  Norwegian:'', Danish:'', Finnish:'', Belgian:'', Swiss:'',
  Austrian:'', Greek:'', Czech:'', Hungarian:'', Moroccan:'',
}

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminClient = getAdminClient()

  const { data: room } = await adminClient
    .from('partner_rooms')
    .select('*, housing_partners(*)')
    .eq('id', id)
    .single() as unknown as { data: PartnerRoomRow | null }

  if (!room) notFound()

  // Fire-and-forget view increment
  void (getAdminClient() as ReturnType<typeof getAdminClient>)
    .from('partner_rooms')
    .update({ views: room.views + 1 })
    .eq('id', id)

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/housing" className="hover:text-white transition-colors">Housing</Link>
          <span>/</span>
          <span className="text-white/60">{room.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left column */}
          <div className="flex-1 min-w-0">

            {/* Photo gallery */}
            <PhotoGallery photos={room.photos} title={room.title} />

            {/* Title + badges */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-orange-400 text-brand-dark text-xs font-bold px-2.5 py-1 rounded-full">
                   VERIFIED PARTNER
                </span>
                <span className="text-xs text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  {ROOM_TYPE_LABELS[room.room_type] ?? room.room_type}
                </span>
                {room.bills_included && (
                  <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full">
                    Bills included
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{room.title}</h1>
              <p className="text-white/50 flex items-center gap-1">
                <span></span> {room.neighborhood}
                {room.address && <span className="text-white/30"> · {room.address}</span>}
              </p>
            </div>

            {/* Room details card */}
            <div className="glass-card rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {room.available_from && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Available from</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(room.available_from).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
              )}
              {room.available_until && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Available until</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(room.available_until).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-white/40 text-xs mb-1">Gender preference</p>
                <p className="text-white text-sm font-medium">
                  {GENDER_LABELS[room.gender_preference] ?? room.gender_preference}
                </p>
              </div>
              {room.flatmates_count > 0 && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Flatmates</p>
                  <p className="text-white text-sm font-medium">{room.flatmates_count} roommate{room.flatmates_count !== 1 ?'s' :''}</p>
                </div>
              )}
              {room.flatmates_nationalities.length > 0 && (
                <div className="col-span-2">
                  <p className="text-white/40 text-xs mb-1">Flatmate nationalities</p>
                  <p className="text-sm">
                    {room.flatmates_nationalities.map(n => (
                      <span key={n} className="mr-1" title={n}>
                        {NATIONALITY_FLAGS[n] ??''} {n}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {room.amenities.length > 0 && (
              <div className="glass-card rounded-2xl p-5 mb-6">
                <h2 className="text-white font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {room.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2 text-white/70 text-sm">
                      {AMENITY_DISPLAY[a] ?? a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {room.description && (
              <div className="glass-card rounded-2xl p-5 mb-6">
                <h2 className="text-white font-semibold mb-3">About this room</h2>
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{room.description}</p>
              </div>
            )}

            {/* What happens next */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">What happens next?</h2>
              <ol className="space-y-3">
                {[
                  ['Pay €50 reservation fee','Secure payment via Stripe — fully refundable'],
                  ['Landlord confirms within 48 hours','You\'ll receive their contact details by email once confirmed'],
                  ['Schedule a viewing','Arrange a time that works for you both'],
                  ['Pay rent + deposit to landlord','Agreed directly between you and the landlord'],
                ].map(([step, desc], i) => (
                  <li key={i} className="flex gap-4">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/20 text-brand-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">{step}</p>
                      <p className="text-white/40 text-xs">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right column (sticky sidebar) */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <RoomBookingSidebar room={room} />
          </div>
        </div>
      </div>
    </main>
  )
}
