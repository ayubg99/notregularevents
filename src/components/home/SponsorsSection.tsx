import { getPublicClient } from '@/lib/supabase/public'
import type { SponsorRow } from '@/types/database'

async function getActiveSponsors(): Promise<SponsorRow[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[SponsorsSection]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[SponsorsSection] unexpected:', err)
    return []
  }
}

export default async function SponsorsSection() {
  const sponsors = await getActiveSponsors()
  if (sponsors.length === 0) return null

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-8">
          Our Partners &amp; Sponsors
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {sponsors.map(sponsor => (
            <a
              key={sponsor.id}
              href={sponsor.website_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-200 no-underline"
            >
              {sponsor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  style={{ height: 40, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', maxWidth: 120 }}
                />
              ) : (
                <span className="text-white/60 font-bold text-base">{sponsor.name}</span>
              )}
              {sponsor.discount_text && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623' }}
                >
                  {sponsor.discount_text}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
