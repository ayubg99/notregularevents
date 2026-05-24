export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import ContactSection from '@/components/housing/ContactSection'

const NATIONALITY_FLAGS: Record<string, string> = {
  Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪', Italian: '🇮🇹',
  Portuguese: '🇵🇹', Dutch: '🇳🇱', Polish: '🇵🇱', Romanian: '🇷🇴',
  Greek: '🇬🇷', American: '🇺🇸', British: '🇬🇧', Turkish: '🇹🇷',
  Moroccan: '🇲🇦', Brazilian: '🇧🇷', Mexican: '🇲🇽', Chinese: '🇨🇳',
  Japanese: '🇯🇵', Korean: '🇰🇷', Indian: '🇮🇳', Australian: '🇦🇺',
}

const AMENITY_LABELS: Record<string, string> = {
  wifi:         '📶 WiFi',
  ac:           '❄️ AC',
  washing:      '🧺 Washing machine',
  balcony:      '🌿 Balcony',
  bills:        '💡 Bills included',
  furnished:    '🪑 Furnished',
  private_bath: '🚿 Private bathroom',
  near_uni:     '🏫 Near university',
  parking:      '🅿️ Parking',
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  private_room:   'Private Room',
  shared_room:    'Shared Room',
  studio:         'Studio',
  full_apartment: 'Full Apartment',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Male only', female: 'Female only', mixed: 'Mixed', any: 'Any gender',
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const [{ data: listing }, { data: { user } }] = await Promise.all([
    supabase
      .from('housing_listings')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single(),
    supabase.auth.getUser(),
  ])

  if (!listing) notFound()

  let hasMembership = false
  if (user) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('status, end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    hasMembership =
      !!membership &&
      (membership.end_date === null || new Date(membership.end_date) > new Date())
  }

  // Fire-and-forget view increment — no await, doesn't block render
  void getAdminClient()
    .from('housing_listings')
    .update({ views: listing.views + 1 })
    .eq('id', id)

  const isRoom     = listing.type === 'room_available'
  const mainPhoto  = listing.photos?.[0] ?? null
  const extraPhotos = listing.photos?.slice(1, 4) ?? []

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <Link href="/housing" className="text-white/40 hover:text-white/70 text-sm transition-colors mb-6 inline-block">
          ← Back to all listings
        </Link>

        {/* Type badge + title */}
        <div className="mb-6">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
            isRoom
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isRoom ? '🏠 Room Available' : '👤 Looking for Room'}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{listing.title}</h1>
          <p className="text-white/50 text-sm">
            {listing.neighborhood && `📍 ${listing.neighborhood}`}
            {listing.room_type && ` · ${ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}`}
          </p>
        </div>

        {/* Photos */}
        {mainPhoto ? (
          <div className="mb-8 space-y-2">
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden">
              <Image src={mainPhoto} alt={listing.title} fill className="object-cover" />
            </div>
            {extraPhotos.length > 0 && (
              <div className={`grid gap-2 ${extraPhotos.length === 1 ? 'grid-cols-1' : extraPhotos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {extraPhotos.map((url, i) => (
                  <div key={i} className="relative h-28 rounded-xl overflow-hidden">
                    <Image src={url} alt={`Photo ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 rounded-2xl bg-gradient-to-br from-orange-900/40 to-purple-900/40 flex items-center justify-center text-6xl mb-8">
            {isRoom ? '🏠' : '👤'}
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {isRoom && listing.price && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-white/50 text-xs mb-1">Monthly rent</p>
              <p className="text-brand-primary text-xl font-bold">€{listing.price}</p>
            </div>
          )}
          {listing.available_from && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-white/50 text-xs mb-1">Available from</p>
              <p className="text-white font-semibold text-sm">
                {new Date(listing.available_from).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          )}
          {listing.gender_preference && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-white/50 text-xs mb-1">Gender preference</p>
              <p className="text-white font-semibold text-sm capitalize">
                {GENDER_LABELS[listing.gender_preference] ?? listing.gender_preference}
              </p>
            </div>
          )}
          {listing.flatmates_count > 0 && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-white/50 text-xs mb-1">Flatmates</p>
              <p className="text-white font-semibold text-sm">{listing.flatmates_count} people</p>
              {listing.flatmates_nationalities.length > 0 && (
                <p className="text-base mt-1">
                  {listing.flatmates_nationalities.slice(0, 4).map(n => NATIONALITY_FLAGS[n] ?? '🏳').join('')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Amenities */}
        {listing.amenities.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <h2 className="text-white font-semibold mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map(a => (
                <span key={a} className="bg-white/5 border border-white/10 text-white/60 text-xs px-3 py-1.5 rounded-full">
                  {AMENITY_LABELS[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <h2 className="text-white font-semibold mb-3">About this listing</h2>
            <p className="text-white/60 text-sm leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Posted by */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-4">Posted by</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
              {listing.contact_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{listing.contact_name}</p>
              <p className="text-white/50 text-xs">
                {[listing.nationality, listing.university].filter(Boolean).join(' · ')}
              </p>
            </div>
            <span className="ml-auto text-white/30 text-xs">{listing.views} views</span>
          </div>
        </div>

        {/* Contact */}
        <ContactSection listing={listing} hasMembership={hasMembership} />

      </div>
    </main>
  )
}
