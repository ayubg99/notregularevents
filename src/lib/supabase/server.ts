// @supabase/auth-helpers-nextjs 0.15 re-exports @supabase/ssr under the hood.
// cookies() is async in Next.js 15+ — all server client factories are async.
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Use in Server Components, Server Actions, and Route Handlers
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll is a no-op in Server Components; only works in Route Handlers
          }
        },
      },
    },
  )
}
