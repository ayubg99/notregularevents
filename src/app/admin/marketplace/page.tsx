import { getAdminClient } from'@/lib/supabase/admin'
import { CATEGORIES } from'@/lib/marketplace'
import MarketplaceClient from'./MarketplaceClient'
import type { MarketplaceListingRow } from'@/types/database'

export default async function AdminMarketplacePage() {
  const admin = getAdminClient()
  const { data: listingsRaw } = await admin
    .from('marketplace_listings')
    .select('*')
    .order('created_at', { ascending: false })

  const listings = (listingsRaw ?? []) as MarketplaceListingRow[]

  const total = listings.length
  const active = listings.filter(l => l.status ==='active').length
  const sold = listings.filter(l => l.status ==='sold').length

  const topCat = [...CATEGORIES]
    .map(c => ({ ...c, count: listings.filter(l => l.category === c.id).length }))
    .sort((a, b) => b.count - a.count)[0]

  return (
    <div>
      <div style={{ marginBottom:'28px' }}>
        <h1 className="text-2xl font-bold text-white mb-1">Marketplace</h1>
        <p style={{ color:'#888', fontSize:'14px', margin: 0 }}>Student buy &amp; sell listings</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'12px', marginBottom:'28px' }}>
        {[
          { label:'Total listings', value: String(total), color:'#4ECDC4' },
          { label:'Active', value: String(active), color:'#2ECC71' },
          { label:'Sold', value: String(sold), color:'#888' },
          { label:'Top category', value: topCat?.count ? topCat.label :'—', color:'#FF6B00' },
        ].map(stat => (
          <div key={stat.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px' }}>
            <p style={{ color: stat.color, fontSize:'22px', fontWeight: 700, margin:'0 0 4px' }}>{stat.value}</p>
            <p style={{ color:'#888', fontSize:'12px', margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <MarketplaceClient listings={listings} />
    </div>
  )
}
