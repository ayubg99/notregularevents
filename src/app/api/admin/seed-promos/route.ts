import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = getAdminClient()

  const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString()

  const promos = [
    // Welcome / onboarding codes
    { code: 'WELCOME10',    discount_type: 'percentage', discount_value: 10, applies_to: 'both',   uses_remaining: 100, expires_at: future(90)  },
    { code: 'FIRSTTRIP',    discount_type: 'percentage', discount_value: 15, applies_to: 'trips',  uses_remaining: 50,  expires_at: future(60)  },
    { code: 'FIRSTEVENT',   discount_type: 'percentage', discount_value: 15, applies_to: 'events', uses_remaining: 50,  expires_at: future(60)  },
    // Flat discount codes
    { code: 'SAVE5',        discount_type: 'fixed',      discount_value: 5,  applies_to: 'both',   uses_remaining: 200, expires_at: future(120) },
    { code: 'SAVE10',       discount_type: 'fixed',      discount_value: 10, applies_to: 'trips',  uses_remaining: 100, expires_at: future(90)  },
    { code: 'SAVE20',       discount_type: 'fixed',      discount_value: 20, applies_to: 'trips',  uses_remaining: 30,  expires_at: future(60)  },
    // Seasonal / event codes
    { code: 'SUMMER25',     discount_type: 'percentage', discount_value: 25, applies_to: 'both',   uses_remaining: 75,  expires_at: future(45)  },
    { code: 'BEACH2026',    discount_type: 'percentage', discount_value: 20, applies_to: 'events', uses_remaining: 60,  expires_at: future(30)  },
    { code: 'MOROCCO20',    discount_type: 'percentage', discount_value: 20, applies_to: 'trips',  uses_remaining: 20,  expires_at: future(30)  },
    { code: 'IBIZAPARTY',   discount_type: 'fixed',      discount_value: 15, applies_to: 'trips',  uses_remaining: 25,  expires_at: future(30)  },
    // University / partner codes
    { code: 'UPV2026',      discount_type: 'percentage', discount_value: 10, applies_to: 'both',   uses_remaining: 150, expires_at: future(180) },
    { code: 'UV2026',       discount_type: 'percentage', discount_value: 10, applies_to: 'both',   uses_remaining: 150, expires_at: future(180) },
    { code: 'ERASMUS2026',  discount_type: 'percentage', discount_value: 12, applies_to: 'both',   uses_remaining: 500, expires_at: future(365) },
    // Limited / VIP codes
    { code: 'VIP30',        discount_type: 'percentage', discount_value: 30, applies_to: 'both',   uses_remaining: 10,  expires_at: future(14)  },
    { code: 'FLASH50',      discount_type: 'percentage', discount_value: 50, applies_to: 'events', uses_remaining: 5,   expires_at: future(3)   },
    // No-expiry evergreen codes
    { code: 'FRIENDS',      discount_type: 'percentage', discount_value: 10, applies_to: 'both',   uses_remaining: null, expires_at: null },
    { code: 'STAFF',        discount_type: 'percentage', discount_value: 100, applies_to: 'both',  uses_remaining: 20,  expires_at: null        },
  ]

  // Delete existing seed codes to make route idempotent
  await supabase.from('promo_codes').delete().in('code', promos.map(p => p.code))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('promo_codes').insert(promos as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, codes: promos.length })
}
