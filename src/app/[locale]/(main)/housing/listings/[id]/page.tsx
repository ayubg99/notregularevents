export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
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

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t      = await getTranslations('housing')
  const locale = await getLocale()

  const AMENITY_DISPLAY: Record<string, string> = {
    wifi:         `📶 WiFi`,
    ac:           `❄️ ${locale === 'es' ? 'Aire acondicionado' : 'Air conditioning'}`,
    washing:      `🧺 ${locale === 'es' ? 'Lavadora' : 'Washing machine'}`,
    balcony:      `🌿 ${locale === 'es' ? 'Balcón' : 'Balcony'}`,
    bills:        `💡 ${t('billsIncluded')}`,
    furnished:    `🪑 ${locale === 'es' ? 'Amueblado' : 'Furnished'}`,
    private_bath: `🚿 ${locale === 'es' ? 'Baño privado' : 'Private bathroom'}`,
    near_uni:     `🏫 ${locale === 'es' ? 'Cerca de la universidad' : 'Near university'}`,
    parking:      `🅿️ Parking`,
  }

  const ROOM_TYPE_LABELS: Record<string, string> = {
    private_room:   t('privateRoom'),
    shared_room:    t('sharedRoom'),
    studio:         t('studio'),
    full_apartment: t('fullApartment'),
  }

  const GENDER_LABELS: Record<string, string> = {
    male:   t('maleOnly'),
    female: t('femaleOnly'),
    mixed:  t('mixed'),
    any:    t('anyGender'),
  }

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

  const isRoom    = listing.type === 'room_available'
  const firstName = (name: string) => name.split(' ')[0]
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-GB'

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back link */}
        <div className="mb-6">
          <Link href="/housing" className="text-sm text-white/40 hover:text-white transition-colors">
            {t('backToListings')}
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
                    : 'bg-orange-400/90 text-brand-dark'
                }`}>
                  {isRoom ? t('roomAvailableBadge') : t('lookingForRoomBadge')}
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
                  <p className="text-white/40 text-xs mb-1">{t('availableFrom')}</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(listing.available_from).toLocaleDateString(dateLocale, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {listing.available_until && (
                <div>
                  <p className="text-white/40 text-xs mb-1">{t('availableUntil')}</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(listing.available_until).toLocaleDateString(dateLocale, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {listing.gender_preference && (
                <div>
                  <p className="text-white/40 text-xs mb-1">{t('genderPreference')}</p>
                  <p className="text-white text-sm font-medium">
                    {GENDER_LABELS[listing.gender_preference] ?? listing.gender_preference}
                  </p>
                </div>
              )}
              {listing.flatmates_count > 0 && (
                <div>
                  <p className="text-white/40 text-xs mb-1">{t('flatmates')}</p>
                  <p className="text-white text-sm font-medium">
                    {listing.flatmates_count} {listing.flatmates_count !== 1 ? t('roommatesPlural') : t('roommateOne')}
                  </p>
                </div>
              )}
              {listing.flatmates_nationalities.length > 0 && (
                <div className="col-span-2">
                  <p className="text-white/40 text-xs mb-1">{t('flatmateNationalities')}</p>
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
                <h2 className="text-white font-semibold mb-4">{t('amenities')}</h2>
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
                <h2 className="text-white font-semibold mb-3">{t('aboutThisListing')}</h2>
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Posted by */}
            <div className="glass-card rounded-2xl p-5 mb-6">
              <h2 className="text-white font-semibold mb-4">{t('postedBy')}</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                  {listing.contact_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{firstName(listing.contact_name)}</p>
                  <p className="text-white/50 text-xs">
                    {[
                      listing.nationality && `${NATIONALITY_FLAGS[listing.nationality] ?? ''} ${listing.nationality}`,
                      listing.university,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="ml-auto text-white/30 text-xs">{listing.views} {t('viewsLabel')}</span>
              </div>
            </div>

            {/* What happens next — room_available only */}
            {isRoom && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="text-white font-semibold mb-4">{t('whatHappensNext')}</h2>
                <ol className="space-y-3">
                  {([
                    [t('listingStep1'), t('listingStep1Desc')],
                    [t('listingStep2'), t('listingStep2Desc')],
                    [t('listingStep3'), t('listingStep3Desc')],
                    [t('listingStep4'), t('listingStep4Desc')],
                  ] as [string, string][]).map(([step, desc], i) => (
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
                {isRoom && listing.price && (
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">€{listing.price}</span>
                    <span className="text-white/40 text-sm">{t('perMonth')}</span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {listing.available_from && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">{t('availableFrom')}</span>
                      <span className="text-white font-medium">
                        {new Date(listing.available_from).toLocaleDateString(dateLocale, {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                    </div>
                  )}
                  {listing.gender_preference && listing.gender_preference !== 'any' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">{t('gender')}</span>
                      <span className="text-white font-medium capitalize">{GENDER_LABELS[listing.gender_preference]}</span>
                    </div>
                  )}
                  {listing.room_type && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">{t('roomTypeLabel')}</span>
                      <span className="text-white font-medium">
                        {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t('platformFee')}</span>
                    <span className="text-green-400 font-semibold">{t('platformFeeFree')}</span>
                  </div>
                </div>
              </div>

              {/* Contact section */}
              <ContactSection listing={listing} hasMembership={hasMembership} />
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
