import Link from 'next/link'
import Image from 'next/image'
import type { HousingListingRow } from '@/types/database'

const NATIONALITY_FLAGS: Record<string, string> = {
  Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪', Italian: '🇮🇹',
  Portuguese: '🇵🇹', Dutch: '🇳🇱', Polish: '🇵🇱', Romanian: '🇷🇴',
  Greek: '🇬🇷', American: '🇺🇸', British: '🇬🇧', Turkish: '🇹🇷',
  Moroccan: '🇲🇦', Brazilian: '🇧🇷', Mexican: '🇲🇽', Chinese: '🇨🇳',
  Japanese: '🇯🇵', Korean: '🇰🇷', Indian: '🇮🇳', Australian: '🇦🇺',
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  private_room:  'Private Room',
  shared_room:   'Shared Room',
  studio:        'Studio',
  full_apartment: 'Full Apartment',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Male only', female: 'Female only', mixed: 'Mixed', any: 'Any gender',
}

interface Props {
  listing:       HousingListingRow
  hasMembership: boolean
}

export default function ListingCard({ listing, hasMembership }: Props) {
  const isRoom       = listing.type === 'room_available'
  const mainPhoto    = listing.photos?.[0] ?? null
  const amenityChips = listing.amenities.slice(0, 3)

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col card-hover">
      {/* Photo or placeholder */}
      <div className="relative h-44 w-full bg-gradient-to-br from-orange-900/40 to-purple-900/40 flex-shrink-0">
        {mainPhoto ? (
          <Image src={mainPhoto} alt={listing.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
            {isRoom ? '🏠' : '👤'}
          </div>
        )}
        <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold ${
          isRoom
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
          {isRoom ? 'Room Available' : 'Looking for Room'}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 flex-1">
            {listing.title}
          </h3>
          {isRoom && listing.price && (
            <span className="text-brand-primary font-bold text-sm whitespace-nowrap">
              €{listing.price}/mo
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
          {listing.neighborhood && <span>📍 {listing.neighborhood}</span>}
          {listing.room_type && <span>🛏 {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}</span>}
          {listing.available_from && (
            <span>📅 From {new Date(listing.available_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          )}
        </div>

        {/* Flatmates + gender */}
        <div className="flex items-center gap-2 flex-wrap">
          {listing.flatmates_nationalities.length > 0 && (
            <span className="text-base">
              {listing.flatmates_nationalities.slice(0, 4).map(n => NATIONALITY_FLAGS[n] ?? '🏳').join('')}
            </span>
          )}
          {listing.gender_preference && listing.gender_preference !== 'any' && (
            <span className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/60">
              {GENDER_LABELS[listing.gender_preference]}
            </span>
          )}
        </div>

        {/* Amenities */}
        {amenityChips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenityChips.map(a => (
              <span key={a} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/50">
                {a}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-xs text-white/30">+{listing.amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View details */}
        <Link
          href={`/housing/listings/${listing.id}`}
          className="block text-center py-2 text-white/40 text-xs hover:text-white/70 transition-colors border border-white/5 rounded-full"
        >
          View Details →
        </Link>

        {/* Contact section */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <p className="text-xs text-white/40">{listing.contact_name}</p>
          {hasMembership ? (
            <>
              {listing.contact_whatsapp && (
                <a
                  href={`https://wa.me/${listing.contact_whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#25D366] text-white text-center py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  💬 WhatsApp {listing.contact_name.split(' ')[0]}
                </a>
              )}
              {listing.contact_email && (
                <a
                  href={`mailto:${listing.contact_email}`}
                  className="block bg-white/5 text-white/60 text-center py-2.5 rounded-full text-xs hover:bg-white/10 transition-colors"
                >
                  ✉️ Send Email
                </a>
              )}
            </>
          ) : (
            <Link
              href="/membership"
              className="block border border-yellow-500/30 text-yellow-500 text-center py-2.5 rounded-full text-sm font-semibold hover:bg-yellow-500/10 transition-colors"
            >
              👑 Join to see contact
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
