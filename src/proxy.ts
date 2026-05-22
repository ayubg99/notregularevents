import { type NextRequest } from 'next/server'
import { updateSession, requireAuth } from '@/lib/supabase/middleware'

const PROTECTED = ['/dashboard', '/booking', '/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PROTECTED.some(p => pathname.startsWith(p))) {
    return requireAuth(request)
  }
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
