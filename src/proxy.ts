import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { locales, defaultLocale } from './i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin, scanner, member-card: session refresh only, no locale routing
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/scanner') ||
    pathname.startsWith('/member-card')
  ) {
    return updateSession(request)
  }

  // All other routes: locale routing + session refresh
  const intlResponse = intlMiddleware(request)
  const supabaseResponse = await updateSession(request)

  // Copy Supabase session cookies onto the intl response so auth state persists
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...attrs }) => {
    intlResponse.cookies.set(name, value, attrs as Parameters<typeof intlResponse.cookies.set>[2])
  })

  return intlResponse
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
