import { test, expect } from '@playwright/test'

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Cookie names that Supabase SSR uses.
 *  Format: sb-<projectRef>-auth-token[.chunk]
 *  We match broadly so the test works on both local (127.0.0.1) and hosted projects.
 */
function isAuthCookie(name: string) {
  return name.startsWith('sb-') && name.includes('auth-token')
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('Login flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('login page renders required elements', async ({ page }) => {
    await expect(
      page.locator('input[type="email"]'),
      'Email input should be visible on the login page',
    ).toBeVisible()

    await expect(
      page.locator('input[type="password"]'),
      'Password input should be visible on the login page',
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: /log in|sign in|continue/i }),
      'A submit button should be visible on the login page',
    ).toBeVisible()
  })

  test('successful login redirects to dashboard and sets auth cookies', async ({ page }) => {
    await page.locator('input[type="email"]').fill(process.env.TEST_USER_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /log in/i }).click()

    await page.waitForURL(/dashboard/, { timeout: 15_000 }).catch(() => {
      throw new Error(
        `Login did not redirect to a dashboard route within 15 s.\n` +
        `Current URL: ${page.url()}\n` +
        `Check that LoginForm calls supabase.auth.signInWithPassword and then ` +
        `router.push or window.location to a dashboard URL on success.`,
      )
    })

    const cookies = await page.context().cookies()
    const authCookies = cookies.filter(c => isAuthCookie(c.name))

    expect(
      authCookies.length,
      `No Supabase auth cookies were set after a successful login.\n` +
      `All cookies present: ${cookies.map(c => c.name).join(', ')}\n` +
      `The proxy must call updateSession() → getClaims() on every request so that ` +
      `the server-side setAll() hook can write refreshed tokens back to the response. ` +
      `Check lib/supabase/proxy.ts.`,
    ).toBeGreaterThan(0)

    // The session is chunked — at minimum one chunk must exist.
    // Refresh token lives in the same JSON blob, so presence of any auth cookie is enough.
    const cookieNames = authCookies.map(c => c.name).join(', ')
    expect(
      cookieNames,
      `Auth cookies were found (${cookieNames}) but none looked like Supabase tokens. ` +
      `Expected names matching /sb-.*-auth-token/.`,
    ).toMatch(/sb-.*-auth-token/)
  })

  test('wrong credentials shows an error and does not redirect', async ({ page }) => {
    await page.locator('input[type="email"]').fill('nobody@nowhere.invalid')
    await page.locator('input[type="password"]').fill('definitelywrong')
    await page.getByRole('button', { name: /log in/i }).click()

    // Give the form time to show the error
    await page.waitForTimeout(2_500)

    expect(
      page.url(),
      'Submitting wrong credentials should keep the user on /login — not redirect to a dashboard.',
    ).toMatch(/login/)

    const errorVisible = await page.locator('text=/invalid|incorrect|error|wrong/i').isVisible()
    expect(
      errorVisible,
      `No error message appeared after submitting invalid credentials.\n` +
      `The LoginForm should display the message returned by supabase.auth.signInWithPassword ` +
      `when it fails (e.g. "Invalid login credentials").`,
    ).toBeTruthy()
  })

  test('unauthenticated user is redirected away from the founder dashboard', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/founder/dashboard')

    await page.waitForURL(/login/, { timeout: 8_000 }).catch(() => {
      throw new Error(
        `An unauthenticated user was NOT redirected from /founder/dashboard.\n` +
        `Current URL: ${page.url()}\n` +
        `The founder dashboard layout must be an async server component that calls ` +
        `supabase.auth.getClaims() and calls redirect('/login') when data.claims is null.\n` +
        `Never use getSession() for this check — getClaims() validates the JWT cryptographically.`,
      )
    })
  })

  test('unauthenticated user is redirected away from the creator dashboard', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/creator/dashboard')

    await page.waitForURL(/login/, { timeout: 8_000 }).catch(() => {
      throw new Error(
        `An unauthenticated user was NOT redirected from /creator/dashboard.\n` +
        `Current URL: ${page.url()}\n` +
        `The creator dashboard layout must call getClaims() and redirect to /login on failure.`,
      )
    })
  })

  test('authenticated user visiting /login is redirected to their dashboard', async ({ page }) => {
    // Log in first
    await page.locator('input[type="email"]').fill(process.env.TEST_USER_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /log in/i }).click()
    await page.waitForURL(/dashboard/, { timeout: 15_000 })

    // Now try to visit /login again — should be bounced to dashboard
    await page.goto('/login')
    await page.waitForURL(/dashboard/, { timeout: 8_000 }).catch(() => {
      throw new Error(
        `A logged-in user navigating to /login was not redirected to a dashboard.\n` +
        `Current URL: ${page.url()}\n` +
        `The proxy.ts updateSession should detect an active session on /login and ` +
        `redirect based on the user's role stored in the profiles table.`,
      )
    })
  })

})
