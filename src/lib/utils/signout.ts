import { createClient } from '@/lib/supabase/client'

/**
 * Shared sign-out logic used by all logout buttons.
 *
 * Sequence:
 * 1. Sweep every sb-* cookie from document.cookie immediately (synchronous,
 *    no network — this is the fast path that clears client-visible cookies).
 * 2. Hit the server route to expire httpOnly / SSR-set cookies, with a 4 s
 *    timeout so a slow or unreachable Supabase never blocks the logout.
 * 3. Clear in-memory app state.
 * 4. Navigate to /login.
 * 5. Fire-and-forget supabase.auth.signOut() in the background to invalidate
 *    the refresh token on Supabase's servers.  This is intentionally NOT
 *    awaited — it can hang when the session is already expired and must never
 *    block the redirect.
 */
export async function signOutUser(clearState: () => void): Promise<void> {
  // Step 1: delete every sb-* cookie the browser will let us touch right now
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.trim().split('=')[0]
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Domain=${window.location.hostname}`
      }
    })
  }

  // Step 2: server-side sweep (catches SSR-set cookies) — capped at 4 s
  try {
    await Promise.race([
      fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('signout timeout')), 4000)
      ),
    ])
  } catch (err) {
    console.error('[signOut] server sweep failed (continuing):', err)
  }

  // Step 3: clear in-memory state
  clearState()

  // Step 4: navigate — must happen before the fire-and-forget below so the
  // page transition isn't delayed by a potentially slow network call
  window.location.href = '/login'

  // Step 5: best-effort token invalidation — fire and forget
  try {
    const supabase = createClient()
    supabase.auth.signOut().catch((err) =>
      console.error('[signOut] SDK signOut (background):', err)
    )
  } catch {
    // ignore — we've already navigated away
  }
}
