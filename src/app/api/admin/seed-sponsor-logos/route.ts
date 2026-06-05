import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const LOGOS: Record<string, string> = {
  'Basic-Fit':
    'https://logo.clearbit.com/basic-fit.com',
  'Valencia Bikes':
    'https://logo.clearbit.com/valenciabikes.com',
  'Impact Hub Valencia':
    'https://logo.clearbit.com/impacthub.net',
  'Espit Chupitos':
    'https://logo.clearbit.com/espitchupitos.es',
  'FlixBus':
    'https://logo.clearbit.com/flixbus.com',
  'Decathlon Valencia':
    'https://logo.clearbit.com/decathlon.com',
  'Papagayo Beach Club':
    'https://logo.clearbit.com/papagayo.es',
  "Centre d'Idiomes UV":
    'https://logo.clearbit.com/uv.es',
  'Biciclot':
    'https://logo.clearbit.com/biciclot.net',
  'Nomad Coliving Valencia':
    'https://logo.clearbit.com/nomadcolivingvalencia.com',
}

export async function POST() {
  const supabase = getAdminClient()

  for (const [name, logo_url] of Object.entries(LOGOS)) {
    const { error } = await supabase
      .from('sponsors')
      .update({ logo_url })
      .eq('name', name)
    if (error) return NextResponse.json({ error: `${name}: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: Object.keys(LOGOS).length })
}
