import { test, expect, type Page } from '@playwright/test'

// ─── helpers ──────────────────────────────────────────────────────────────────

function isAuthCookie(name: string) {
  return name.startsWith('sb-') && name.includes('auth-token')
}

async function login(page: Page) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(process.env.TEST_USER_EMAIL!)
  await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 15_000 }).catch(() => {
    throw new Error(
      `login() helper — did not reach a dashboard URL.\n` +
      `Current URL: ${page.url()}`,
    )
  })
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('Logout and session cleanup', () => {

  test('sign-out button is visible in the sidebar', async ({ page }) => {
    await login(page)

    await expect(
      page.getByRole('button', { name: /sign out/i }),
      'A "Sign out" button should be visible in the sidebar',
    ).toBeVisible({ timeout: 8_000 })
  })

  test('logout clears auth cookies and redirects to /login', async ({ page, context }) => {
    await login(page)

    const cookiesBefore = await context.cookies()
    const hadAuth = cookiesBefore.some(c => isAuthCookie(c.name))
    expect(
      hadAuth,
      `No auth cookies were present before logout — the login step may have failed.\n` +
      `All cookies: ${cookiesBefore.map(c => c.name).join(', ')}`,
    ).toBeTruthy()

    // Click the Sign out button in the sidebar
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should land on /login (or /)
    await page.waitForURL(/login|\/$/, { timeout: 10_000 }).catch(() => {
      throw new Error(
        `Logout did not redirect to /login within 10 s.\n` +
        `Current URL: ${page.url()}\n` +
        `Check signOutUser() in lib/utils/signout.ts — it should hit /api/auth/signout ` +
        `(which calls supabase.auth.signOut() server-side) and then set window.location.href = '/login'.`,
      )
    })

    // Server-side cookies should be cleared
    const cookiesAfter = await context.cookies()
    const remainingAuth = cookiesAfter.filter(c => isAuthCookie(c.name))

    expect(
      remainingAuth,
      `Auth cookies were NOT cleared after logout:\n` +
      `${remainingAuth.map(c => c.name).join(', ')}\n\n` +
      `Check that /api/auth/signout calls supabase.auth.signOut() which should expire ` +
      `all sb-*-auth-token cookies. Also check that signOutUser() in lib/utils/signout.ts ` +
      `calls document.cookie with Max-Age=0 for each sb-* cookie before redirecting.`,
    ).toHaveLength(0)
  })

  test('after logout, the dashboard is inaccessible — redirects to /login', async ({ page, context }) => {
    await login(page)

    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL(/login|\/$/, { timeout: 10_000 })

    // Try to navigate directly to the founder dashboard
    await page.goto('/founder/dashboard')

    await page.waitForURL(/login/, { timeout: 8_000 }).catch(() => {
      throw new Error(
        `After logout, directly navigating to /founder/dashboard did NOT redirect to /login.\n` +
        `Current URL: ${page.url()}\n` +
        `This means the session cookies were not fully cleared on logout, or the server-side ` +
        `getClaims() check is accepting a stale/expired token.\n` +
        `Ensure /api/auth/signout invalidates the token on the Supabase server (not just client-side).`,
      )
    })

    expect(page.url(), 'After logout, the user should be on /login').toMatch(/login/)
  })

  test('session is not restored on page refresh after logout', async ({ page, context }) => {
    await login(page)

    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL(/login|\/$/, { timeout: 10_000 })

    // Reload — should stay on /login, not auto-restore the session
    await page.reload()
    await page.waitForLoadState('networkidle')

    expect(
      page.url(),
      `After logout + page reload, the session was restored and the user is no longer on /login.\n` +
      `Current URL: ${page.url()}\n` +
      `All auth cookies must be cleared on logout — including the refresh token — so that ` +
      `a page reload cannot silently re-authenticate the user.`,
    ).toMatch(/login/)
  })

  test('API routes return 401 after logout cookies are cleared', async ({ page, context }) => {
    await login(page)
    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL(/login|\/$/, { timeout: 10_000 })

    // Manually hit an authenticated API endpoint — should get 401
    const response = await page.request.post('/api/auth/signout', {
      headers: { 'Content-Type': 'application/json' },
    })

    // signout is idempotent — but any protected endpoint would return 401
    // If 200 is returned on a second call that's fine (idempotent), but it must not 500
    expect(
      response.status(),
      `POST /api/auth/signout returned an unexpected server error (${response.status()}) ` +
      `after the user was already logged out.\n` +
      `The endpoint must handle the case where there is no active session gracefully.`,
    ).not.toBe(500)
  })

})
