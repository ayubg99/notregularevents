import { createClient } from'@supabase/supabase-js'
import type { Database } from'@/types/database'

// Cookie-free client for public/anonymous reads in static server components
export function getPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
