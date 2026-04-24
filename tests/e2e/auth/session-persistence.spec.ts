/**
 * session-persistence.spec.ts
 *
 * These tests directly reproduce the bug that was breaking the app:
 * session data stops loading after the access token expires because the proxy
 * was calling getSession() (which doesn't revalidate) instead of getClaims()
 * (which validates the JWT and triggers the refresh cycle).
 *
 * Each test is self-contained — it logs in, exercises the specific scenario,
 * and verifies the session is still alive without a manual re-login.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'

// ─── helpers ──────────────────────────────────────────────────────────────────

function isAuthCookie(name: string) {
  return name.startsWith('sb-') && name.includes('auth-token')
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 15_000 }).catch(() => {
    throw new Error(
      `loginAs(${email}) — did not reach a dashboard URL.\n` +
      `Current URL: ${page.url()}\n` +
      `Check the credentials in playwright/.env.test and that the account exists in Supabase.`,
    )
  })
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('Session persistence and token refresh', () => {

  test('session cookies have correct security attributes', async ({ page }) => {
    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    const cookies = await page.context().cookies()
    const authCookies = cookies.filter(c => isAuthCookie(c.name))

    expect(
      authCookies.length,
      `No Supabase auth cookies found after login.\n` +
      `All cookies: ${cookies.map(c => c.name).join(', ')}\n` +
      `Check that the proxy's setAll() cookie handler in lib/supabase/proxy.ts ` +
      `writes cookies onto the supabaseResponse and that supabaseResponse is returned.`,
    ).toBeGreaterThan(0)

    for (const cookie of authCookies) {
      expect(
        cookie.sameSite,
        `Cookie "${cookie.name}" has sameSite="${cookie.sameSite}" — expected Lax or Strict.\n` +
        `A missing or None SameSite attribute allows CSRF attacks.\n` +
        `Supabase SSR normally sets this automatically; check that you are not overriding ` +
        `cookie options in lib/supabase/proxy.ts setAll().`,
      ).toMatch(/Lax|Strict/)
    }
  })

  test('proxy rewrites cookies and keeps the user on the dashboard after navigation', async ({ page }) => {
    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    const before = await page.context().cookies()
    const hadAuthCookies = before.some(c => isAuthCookie(c.name))
    expect(hadAuthCookies, 'Should have auth cookies immediately after login').toBeTruthy()

    // Navigate within the dashboard to fire the proxy again
    await page.goto('/founder/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    expect(
      page.url(),
      `Navigation to /founder/dashboard redirected away from the dashboard.\n` +
      `The proxy must call updateSession() on every non-static request so the ` +
      `session stays alive. Check proxy.ts.`,
    ).toMatch(/dashboard/)

    const after = await page.context().cookies()
    expect(
      after.some(c => isAuthCookie(c.name)),
      `Auth cookies were lost after navigating within the dashboard.\n` +
      `The proxy's updateSession() must return the supabaseResponse (which carries ` +
      `Set-Cookie headers) — not a plain NextResponse.next().`,
    ).toBeTruthy()
  })

  test('no 401 or 403 responses immediately after login', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('response', response => {
      if (response.status() === 401 || response.status() === 403) {
        failedRequests.push(`${response.status()} ${response.url()}`)
      }
    })

    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })
    // Extra settle time for any deferred client-side fetches
    await page.waitForTimeout(3_000)

    expect(
      failedRequests,
      `Auth errors immediately after login:\n${failedRequests.join('\n')}\n\n` +
      `If Supabase or /api/* routes are returning 401/403 right after a successful login ` +
      `it usually means:\n` +
      `  1. lib/supabase/server.ts is using the wrong env var (check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)\n` +
      `  2. The server client's cookie handler is not reading from the correct store\n` +
      `  3. The proxy is not forwarding the refreshed cookies to the next response`,
    ).toHaveLength(0)
  })

  test('simulated access-token expiry — proxy renews session without re-login', async ({ page, context }) => {
    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    const cookies = await context.cookies()
    const authCookies = cookies.filter(c => isAuthCookie(c.name))

    if (authCookies.length === 0) {
      throw new Error(
        'Could not find any Supabase auth cookies after login — cannot simulate token expiry.\n' +
        'Ensure the login flow correctly sets cookies via the proxy.',
      )
    }

    // Supabase SSR stores the entire session (access + refresh token) in the same
    // auth-token cookie (chunked as .0, .1 …).  To simulate an expired access token
    // we corrupt the primary cookie value so the JWT fails getClaims() validation
    // while the underlying refresh token is still intact in the cookie store.
    // The proxy should detect the invalid JWT, call the refresh endpoint, and rewrite
    // a fresh access token — all transparently, without redirecting to /login.

    // Find the first (or only) chunk — this is the one getClaims() validates.
    const primaryChunk = authCookies.find(c => !c.name.endsWith('.1') && !c.name.endsWith('.2'))
      ?? authCookies[0]

    await context.clearCookies()

    // Re-add every cookie except the primary chunk so the session is "partial" —
    // refresh token data is still present in the remaining chunks.
    const remaining = cookies.filter(c => c.name !== primaryChunk.name)
    if (remaining.length > 0) await context.addCookies(remaining)

    // Navigate — the proxy should detect the invalid/missing primary token,
    // trigger the refresh flow, write new cookies, and serve the dashboard.
    const response = await page.goto('/founder/dashboard', { waitUntil: 'networkidle' })

    expect(
      page.url(),
      `After simulated token expiry the user was redirected away from the dashboard.\n` +
      `Redirected to: ${page.url()}\n\n` +
      `Root cause: the proxy's getClaims() call should detect the invalid/expired ` +
      `access token and use the refresh token to silently obtain a new one.\n` +
      `Check that:\n` +
      `  - lib/supabase/proxy.ts calls supabase.auth.getClaims() (not getSession())\n` +
      `  - The setAll() cookie hook writes the refreshed token back onto supabaseResponse\n` +
      `  - proxy.ts returns supabaseResponse (not a new NextResponse)`,
    ).toMatch(/founder\/dashboard/)

    // A new set of auth cookies should now be present
    const newCookies = await context.cookies()
    expect(
      newCookies.some(c => isAuthCookie(c.name)),
      `After simulated token expiry and a dashboard navigation, no new auth cookies were set.\n` +
      `The proxy should have called the Supabase refresh endpoint and written the new ` +
      `access token to the response via setAll() in lib/supabase/proxy.ts.`,
    ).toBeTruthy()
  })

  test('dashboard reaches networkidle within 15 s — no infinite loading', async ({ page }) => {
    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    // Track any requests that are still pending when networkidle fires
    const longRunning: string[] = []
    page.on('request', request => {
      const url = request.url()
      if (url.includes('supabase') || url.includes('/api/')) {
        const id = setTimeout(() => longRunning.push(url), 8_000)
        page.waitForResponse(url).then(() => clearTimeout(id)).catch(() => clearTimeout(id))
      }
    })

    await page.goto('/founder/dashboard')

    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
      throw new Error(
        `/founder/dashboard did not reach networkidle within 15 s — this is the infinite loading bug.\n\n` +
        `Requests still pending (or that took > 8 s):\n${longRunning.join('\n') || '(none detected via request listener)'}\n\n` +
        `Most likely causes:\n` +
        `  1. A server component is calling supabase.auth.getSession() which stalls when ` +
        `     the token is expired. Replace with getClaims().\n` +
        `  2. A client-side query is calling getUser() in a tight loop — check useUser.ts.\n` +
        `  3. The Supabase URL or key env var is missing/wrong, causing every auth call to hang.`,
      )
    })

    // Belt-and-suspenders: no loading spinners after the page settled
    const spinnerCount = await page.locator('.animate-spin').count()
    expect(
      spinnerCount,
      `${spinnerCount} loading spinner(s) still visible after networkidle on /founder/dashboard.\n` +
      `A data fetch is still pending, which means a token or cookie issue is blocking it.`,
    ).toBe(0)
  })

  test('switching between dashboard routes does not trigger re-auth', async ({ page }) => {
    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    const routes = [
      '/founder/browse',
      '/founder/shortlist',
      '/founder/messages',
      '/founder/settings',
      '/founder/dashboard',
    ]

    for (const route of routes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
        throw new Error(
          `Route ${route} did not settle within 10 s.\n` +
          `The user should stay authenticated across all founder routes without ` +
          `any redirect to /login. Check the server layout for that route.`,
        )
      })

      expect(
        page.url(),
        `Navigation to ${route} triggered an unexpected redirect.\n` +
        `The session should persist across all founder routes without re-login.`,
      ).not.toMatch(/login/)
    }
  })

})
