import Link from 'next/link'
import type { HousingListingRow } from '@/types/database'

interface Props {
  listing:       HousingListingRow
  hasMembership: boolean
}

export default function ContactSection({ listing, hasMembership }: Props) {
  if (!hasMembership) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
        <p className="text-3xl mb-2">👑</p>
        <h3 className="text-yellow-400 font-semibold text-base mb-2">Members only</h3>
        <p className="text-white/50 text-sm mb-5">
          Join membership to see contact details.
        </p>
        <Link
          href="/membership"
          className="inline-block bg-yellow-500 text-black font-bold px-6 py-3 rounded-full text-sm hover:bg-yellow-400 transition-colors"
        >
          Join for €9.99/month →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 space-y-3">
      <h3 className="text-green-400 font-semibold text-base">📞 Contact Details</h3>
      {listing.contact_whatsapp && (
        <a
          href={`https://wa.me/${listing.contact_whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[#25D366] text-white text-center py-3.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
        >
          💬 WhatsApp {listing.contact_name}
        </a>
      )}
      {listing.contact_email && (
        <a
          href={`mailto:${listing.contact_email}`}
          className="block bg-white/5 text-white/60 text-center py-3.5 rounded-full text-sm hover:bg-white/10 transition-colors"
        >
          ✉️ {listing.contact_email}
        </a>
      )}
    </div>
  )
}
