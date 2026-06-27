import { Link } from '@/i18n/navigation'
import type { PartnerRoomRow } from '@/types/database'

const ROOM_TYPE_LABELS: Record<string, string> = {
  private_room:    'Private Room',
  shared_room:     'Shared Room',
  studio:          'Studio',
  full_apartment:  'Full Apartment',
}

const AMENITY_ICONS: Record<string, string> = {
  wifi:              '📶 WiFi',
  ac:                '❄️ AC',
  washing_machine:   '🧺 Washer',
  balcony:           '🌿 Balcony',
  bills_included:    '💡 Bills incl.',
  furnished:         '🪑 Furnished',
  private_bathroom:  '🚿 En-suite',
  near_university:   '🏫 Near uni',
  parking:           '🅿️ Parking',
  elevator:          '🛗 Elevator',
  heating:           '🔥 Heating',
}

export default function PartnerRoomCard({ room }: { room: PartnerRoomRow }) {
  const photo      = room.photos?.[0] ?? null
  const topAmenities = room.amenities.slice(0, 3)

  return (
    <Link
      href={`/housing/rooms/${room.id}`}
      className="block glass-card rounded-2xl overflow-hidden hover:border-brand-primary/40 hover:-translate-y-1 transition-all duration-200 group"
    >
      {/* Photo */}
      <div className="relative h-48 overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-accent" />
        )}

        {/* Verified badge */}
        <span className="absolute top-3 left-3 bg-amber-400 text-brand-dark text-xs font-bold px-2.5 py-1 rounded-full">
          ⭐ VERIFIED
        </span>

        {/* Price badge */}
        <span className="absolute top-3 right-3 bg-black/70 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
          €{room.monthly_rent}/mo
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-white font-semibold text-base mb-2 line-clamp-1">{room.title}</h3>

        {/* Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            📍 {room.neighborhood}
          </span>
          <span className="text-xs text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {ROOM_TYPE_LABELS[room.room_type] ?? room.room_type}
          </span>
          {room.bills_included && (
            <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              Bills included
            </span>
          )}
        </div>

        {/* Available from */}
        {room.available_from && (
          <p className="text-white/50 text-xs mb-3">
            Available from{' '}
            {new Date(room.available_from).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
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

        {/* Pricing breakdown */}
        <div className="border-t border-white/10 pt-3 mb-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Monthly rent</span>
            <span className="text-white font-medium">€{room.monthly_rent}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Deposit</span>
            <span className="text-white font-medium">€{room.deposit_amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Platform fee</span>
            <span className="text-brand-accent font-medium">€{room.platform_fee} once</span>
          </div>
        </div>

        {/* CTA */}
        <div className="btn-primary w-full text-center py-2.5 rounded-xl text-sm font-semibold">
          See Details
        </div>
      </div>
    </Link>
  )
}
