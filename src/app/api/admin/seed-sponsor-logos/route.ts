import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const LOGOS: Record<string, string> = {
  'Basic-Fit':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Basic-Fit_logo.svg/400px-Basic-Fit_logo.svg.png',
  'FlixBus':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Flixbus_logo.svg/400px-Flixbus_logo.svg.png',
  'Decathlon Valencia':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Decathlon_logo.svg/400px-Decathlon_logo.svg.png',
  'Impact Hub Valencia':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Impact_Hub_logo.svg/400px-Impact_Hub_logo.svg.png',
  "Centre d'Idiomes UV":
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Universitat_de_Val%C3%A8ncia_logo.svg/400px-Universitat_de_Val%C3%A8ncia_logo.svg.png',
  'Espit Chupitos':
    'https://espitchupitos.es/wp-content/uploads/2022/01/logo-espit-chupitos-blanco.png',
  'Valencia Bikes':
    'https://www.valenciabikes.com/wp-content/uploads/2019/01/logo-valencia-bikes.png',
  'Papagayo Beach Club':
    'https://papagayo.es/wp-content/uploads/2020/01/logo-papagayo.png',
  'Biciclot':
    'https://biciclot.net/wp-content/uploads/2019/03/logo-biciclot.png',
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
