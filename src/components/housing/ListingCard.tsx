import Link from 'next/link'
import type { HousingListingRow } from '@/types/database'

const NATIONALITY_FLAGS: Record<string, string> = {
  Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪', Italian: '🇮🇹',
  Portuguese: '🇵🇹', Dutch: '🇳🇱', Polish: '🇵🇱', Romanian: '🇷🇴',
  Greek: '🇬🇷', American: '🇺🇸', British: '🇬🇧', Turkish: '🇹🇷',
  Moroccan: '🇲🇦', Brazilian: '🇧🇷', Mexican: '🇲🇽', Chinese: '🇨🇳',
  Japanese: '🇯🇵', Korean: '🇰🇷', Indian: '🇮🇳', Australian: '🇦🇺',
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  private_room:   'Private Room',
  shared_room:    'Shared Room',
  studio:         'Studio',
  full_apartment: 'Full Apartment',
}

const AMENITY_ICONS: Record<string, string> = {
  wifi:             '📶 WiFi',
  ac:               '❄️ AC',
  washing:          '🧺 Washer',
  balcony:          '🌿 Balcony',
  bills:            '💡 Bills incl.',
  furnished:        '🪑 Furnished',
  private_bath:     '🚿 En-suite',
  near_uni:         '🏫 Near uni',
  parking:          '🅿️ Parking',
}

interface Props {
  listing:       HousingListingRow
  hasMembership: boolean
}

export default function ListingCard({ listing, hasMembership }: Props) {
  const isRoom        = listing.type === 'room_available'
  const photo         = listing.photos?.[0] ?? null
  const topAmenities  = listing.amenities.slice(0, 3)

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200 group">

      {/* Photo / placeholder */}
      <div className="relative h-48 overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-5xl ${
            isRoom
              ? 'bg-gradient-to-br from-teal-500/30 to-brand-dark'
              : 'bg-gradient-to-br from-amber-500/30 to-brand-dark'
          }`}>
            {isRoom ? '🏠' : '👤'}
          </div>
        )}

        {/* Type badge */}
        <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${
          isRoom
            ? 'bg-teal-400/90 text-brand-dark'
            : 'bg-amber-400/90 text-brand-dark'
        }`}>
          {isRoom ? '🏠 Room Available' : '👤 Looking for Room'}
        </span>

        {/* Price badge */}
        {isRoom && listing.price && (
          <span className="absolute top-3 right-3 bg-black/70 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            €{listing.price}/mo
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-white font-semibold text-base mb-2 line-clamp-1">{listing.title}</h3>

        {/* Pills row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.neighborhood && (
            <span className="text-xs text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              📍 {listing.neighborhood}
            </span>
          )}
          {listing.room_type && (
            <span className="text-xs text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}
            </span>
          )}
        </div>

        {/* Available from */}
        {listing.available_from && (
          <p className="text-white/50 text-xs mb-3">
            Available from{' '}
            {new Date(listing.available_from).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        )}

        {/* Flatmates + gender */}
        {(listing.flatmates_nationalities.length > 0 || (listing.gender_preference && listing.gender_preference !== 'any')) && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {listing.flatmates_nationalities.length > 0 && (
              <span className="text-base">
                {listing.flatmates_nationalities.slice(0, 4).map(n => NATIONALITY_FLAGS[n] ?? '🏳').join('')}
              </span>
            )}
            {listing.gender_preference && listing.gender_preference !== 'any' && (
              <span className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/60 capitalize">
                👥 {listing.gender_preference}
              </span>
            )}
          </div>
        )}

        {/* Amenities */}
        {topAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topAmenities.map(a => (
              <span key={a} className="text-xs text-white/50">
                {AMENITY_ICONS[a] ?? a}
              </span>
            ))}
          </div>
        )}

        {/* Pricing box */}
        <div className="border-t border-white/10 pt-3 mb-4 space-y-1">
          {isRoom && listing.price && (
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Monthly rent</span>
              <span className="text-white font-medium">€{listing.price}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Contact</span>
            <span className={`text-xs font-semibold ${hasMembership ? 'text-green-400' : 'text-amber-400'}`}>
              {hasMembership ? '✅ Visible' : '👑 Members only'}
            </span>
          </div>
        </div>

        {/* CTA */}
        {hasMembership ? (
          <Link
            href={`/housing/listings/${listing.id}`}
            className="block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-400 to-green-400 text-brand-dark hover:opacity-90 transition-opacity"
          >
            View Details & Contact →
          </Link>
        ) : (
          <Link
            href="/membership"
            className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold border border-amber-400/30 text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 transition-colors"
          >
            👑 Join to Contact
          </Link>
        )}
      </div>
    </div>
  )
}
