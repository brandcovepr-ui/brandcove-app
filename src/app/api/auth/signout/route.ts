import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/signout
 *
 * Server-side sign out.  Two distinct jobs:
 *
 * 1. Invalidate the session on Supabase's servers so the token cannot
 *    be reused even if someone intercepts it.
 *
 * 2. Expire every sb-* cookie in the *returned* NextResponse so the
 *    browser deletes them on receipt.
 *
 * IMPORTANT: we do NOT rely on the Supabase server client's `setAll`
 * callback writing expired cookies to `cookieStore` from next/headers,
 * because in Next.js 15 Route Handlers the cookies() mutation and an
 * explicit NextResponse are separate response objects.  We write the
 * expired cookies directly onto the NextResponse we return so there is
 * no ambiguity about which response reaches the browser.
 */
export async function POST(request: NextRequest) {
  // Best-effort server-side session invalidation.
  // We wrap in try/catch so a Supabase outage or misconfigured env
  // never blocks the cookie cleanup that follows.
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('[signout] server signOut error (continuing cleanup):', err)
  }

  // Build the response first, then attach expired cookie directives to it.
  const response = NextResponse.json({ success: true })

  // Collect every sb-* name the browser sent in this request and expire
  // them all.  Supabase may chunk large JWTs across sb-xxx.0, sb-xxx.1 …
  // so we sweep by prefix rather than exact name.
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-')) {
      response.cookies.set(name, '', {
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      })
    }
  })

  return response
}
