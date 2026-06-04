import { createBrowserClient } from'@supabase/ssr'
import type { Database } from'@/types/database'

// Singleton for Client Components — call once per component tree, not per render
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
