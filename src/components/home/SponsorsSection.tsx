import { getPublicClient } from'@/lib/supabase/public'
import type { SponsorRow } from'@/types/database'

async function getActiveSponsors(): Promise<SponsorRow[]> {
  try {
    const supabase = getPublicClient()
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('status','active')
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
    <section className="py-20 px-5">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-10">
          Our Partners &amp; Sponsors
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12">
          {sponsors.map(sponsor => (
            <a
              key={sponsor.id}
              href={sponsor.website_url ??'#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-200 no-underline"
            >
              {sponsor.logo_url ? (
                <div style={{
                  background:'rgba(255,255,255,0.08)',
                  borderRadius:'12px',
                  padding:'12px 20px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  width:'120px',
                  height:'60px',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    style={{ maxHeight: 36, maxWidth: 100, width:'auto', objectFit:'contain' }}
                  />
                </div>
              ) : (
                <div style={{
                  background:'rgba(255,255,255,0.08)',
                  borderRadius:'12px',
                  padding:'12px 20px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  width:'120px',
                  height:'60px',
                }}>
                  <span className="text-white/60 font-bold text-sm text-center leading-tight">{sponsor.name}</span>
                </div>
              )}
              {sponsor.discount_text && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background:'rgba(255,107,0,0.12)', color:'#FF6B00' }}
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
