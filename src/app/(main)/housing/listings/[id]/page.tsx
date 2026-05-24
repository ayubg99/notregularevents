export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import PhotoGallery from '@/components/housing/PhotoGallery'
import ContactSection from '@/components/housing/ContactSection'

const NATIONALITY_FLAGS: Record<string, string> = {
  Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪', Italian: '🇮🇹',
  Portuguese: '🇵🇹', Dutch: '🇳🇱', Polish: '🇵🇱', Romanian: '🇷🇴',
  Greek: '🇬🇷', American: '🇺🇸', British: '🇬🇧', Turkish: '🇹🇷',
  Moroccan: '🇲🇦', Brazilian: '🇧🇷', Mexican: '🇲🇽', Chinese: '🇨🇳',
  Japanese: '🇯🇵', Korean: '🇰🇷', Indian: '🇮🇳', Australian: '🇦🇺',
}

const AMENITY_DISPLAY: Record<string, string> = {
  wifi:         '📶 WiFi',
  ac:           '❄️ Air conditioning',
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

  void getAdminClient()
    .from('housing_listings')
    .update({ views: listing.views + 1 })
    .eq('id', id)

  const isRoom = listing.type === 'room_available'

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back link */}
        <div className="mb-6">
          <Link href="/housing" className="text-sm text-white/40 hover:text-white transition-colors">
            ← Back to all listings
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left column ───────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Photo gallery */}
            <PhotoGallery photos={listing.photos ?? []} title={listing.title} />

            {/* Title + badges */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isRoom
                    ? 'bg-teal-400/90 text-brand-dark'
                    : 'bg-amber-400/90 text-brand-dark'
                }`}>
                  {isRoom ? '🏠 Room Available' : '👤 Looking for Room'}
                </span>
                {listing.room_type && (
                  <span className="text-xs text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                    {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{listing.title}</h1>
              {listing.neighborhood && (
                <p className="text-white/50 flex items-center gap-1">
                  <span>📍</span> {listing.neighborhood}
                </p>
              )}
            </div>

            {/* Details card */}
            <div className="glass-card rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {listing.available_from && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Available from</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(listing.available_from).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {listing.available_until && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Available until</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(listing.available_until).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {listing.gender_preference && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Gender preference</p>
                  <p className="text-white text-sm font-medium">
                    {GENDER_LABELS[listing.gender_preference] ?? listing.gender_preference}
                  </p>
                </div>
              )}
              {listing.flatmates_count > 0 && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Flatmates</p>
                  <p className="text-white text-sm font-medium">
                    {listing.flatmates_count} roommate{listing.flatmates_count !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {listing.flatmates_nationalities.length > 0 && (
                <div className="col-span-2">
                  <p className="text-white/40 text-xs mb-1">Flatmate nationalities</p>
                  <p className="text-sm">
                    {listing.flatmates_nationalities.map(n => (
                      <span key={n} className="mr-1" title={n}>
                        {NATIONALITY_FLAGS[n] ?? '🌍'} {n}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div className="glass-card rounded-2xl p-5 mb-6">
                <h2 className="text-white font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listing.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2 text-white/70 text-sm">
                      {AMENITY_DISPLAY[a] ?? a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="glass-card rounded-2xl p-5 mb-6">
                <h2 className="text-white font-semibold mb-3">About this listing</h2>
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
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
                    {[
                      listing.nationality && `${NATIONALITY_FLAGS[listing.nationality] ?? ''} ${listing.nationality}`,
                      listing.university,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="ml-auto text-white/30 text-xs">{listing.views} views</span>
              </div>
            </div>

            {/* What happens next — room_available only */}
            {isRoom && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="text-white font-semibold mb-4">What happens next?</h2>
                <ol className="space-y-3">
                  {[
                    ['Join membership', 'Get access to contact details for all student listings'],
                    ['Contact the student', 'Reach out via WhatsApp or email directly'],
                    ['Arrange a viewing', 'Visit the room and meet your potential flatmates'],
                    ['Sign the contract', 'Agree terms and sign the rental contract'],
                  ].map(([step, desc], i) => (
                    <li key={i} className="flex gap-4">
                      <span className="w-7 h-7 rounded-full bg-teal-400/20 text-teal-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
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
            )}
          </div>

          {/* ── Right column (sticky sidebar) ──── */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-28 space-y-4">

              {/* Pricing card */}
              <div className="glass-card rounded-2xl p-6">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
                  {isRoom ? '🏠 Student Listing' : '👤 Looking for Room'}
                </p>

                {isRoom && listing.price && (
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">€{listing.price}</span>
                    <span className="text-white/40 text-sm">/month</span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {listing.available_from && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Available from</span>
                      <span className="text-white font-medium">
                        {new Date(listing.available_from).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                    </div>
                  )}
                  {listing.gender_preference && listing.gender_preference !== 'any' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Gender</span>
                      <span className="text-white font-medium capitalize">{listing.gender_preference}</span>
                    </div>
                  )}
                  {listing.room_type && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Room type</span>
                      <span className="text-white font-medium">
                        {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Platform fee</span>
                    <span className="text-green-400 font-semibold">Free</span>
                  </div>
                </div>

                {hasMembership ? (
                  <a
                    href="#contact"
                    className="block w-full text-center py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-400 to-green-400 text-brand-dark hover:opacity-90 transition-opacity"
                  >
                    Contact Student →
                  </a>
                ) : (
                  <Link
                    href="/membership"
                    className="block w-full text-center py-3 rounded-xl text-sm font-semibold border border-amber-400/30 text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 transition-colors"
                  >
                    👑 Join to Contact
                  </Link>
                )}

                <div className="mt-4 space-y-1.5">
                  <p className="text-white/30 text-xs flex items-center gap-1.5">
                    <span>✅</span> Verified Erasmus member
                  </p>
                  <p className="text-white/30 text-xs flex items-center gap-1.5">
                    <span>✅</span> Free to contact
                  </p>
                </div>
              </div>

              {/* Contact section */}
              <div id="contact">
                <ContactSection listing={listing} hasMembership={hasMembership} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
