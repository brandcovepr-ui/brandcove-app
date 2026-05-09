import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Next.js middleware — runs on every request that matches the config below.
// Calls updateSession() which uses getClaims() (not getSession()) to validate
// the JWT and refresh it when expired, writing the new tokens back via the
// setAll cookie hook so the refreshed session propagates to both the server
// and the browser.
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
