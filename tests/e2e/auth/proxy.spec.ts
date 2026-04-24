/**
 * proxy.spec.ts
 *
 * Directly tests that the Next.js proxy (proxy.ts → lib/supabase/proxy.ts)
 * is running correctly on every non-static request, refreshing the session,
 * and not leaking errors or blocking static assets.
 */

import { test, expect, type Page } from '@playwright/test'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(/dashboard/, { timeout: 15_000 }).catch(() => {
    throw new Error(
      `Login did not reach dashboard.\nCurrent URL: ${page.url()}`,
    )
  })
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('Proxy / updateSession behaviour', () => {

  test('proxy does not produce 500 errors on dashboard page loads', async ({ page }) => {
    const proxyErrors: string[] = []

    page.on('response', response => {
      // A 500 on a page route often means proxy.ts or the layout threw an unhandled error
      if (
        response.status() === 500 &&
        !response.url().includes('/_next/') &&
        !response.url().match(/\.(svg|png|jpg|webp|ico|woff|css|js)$/)
      ) {
        proxyErrors.push(`500 — ${response.url()}`)
      }
    })

    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // Navigate to a few more routes to exercise the proxy repeatedly
    for (const route of ['/founder/browse', '/founder/messages', '/founder/settings']) {
      await page.goto(route)
      await page.waitForLoadState('networkidle', { timeout: 10_000 })
    }

    expect(
      proxyErrors,
      `The proxy returned HTTP 500 on the following routes:\n${proxyErrors.join('\n')}\n\n` +
      `Common causes:\n` +
      `  1. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing/wrong\n` +
      `  2. lib/supabase/proxy.ts — createServerClient() or getClaims() threw instead of returning an error object\n` +
      `  3. A server component layout crashed during getClaims() or the profile query\n` +
      `Check the server logs and the trace attached to this test run.`,
    ).toHaveLength(0)
  })

  test('static assets are excluded from the proxy and load quickly', async ({ page }) => {
    const slowOrProxied: string[] = []

    page.on('response', async response => {
      const url = response.url()
      const isStatic =
        url.includes('/_next/static') ||
        url.includes('/_next/image') ||
        url.match(/\.(svg|png|jpg|jpeg|webp|ico|woff2?)$/)

      if (isStatic) {
        const timing = response.request().timing()
        // More than 1 s for a static file strongly suggests it hit the proxy
        if (timing.responseEnd - timing.requestStart > 1_000) {
          slowOrProxied.push(`${url} — ${(timing.responseEnd - timing.requestStart).toFixed(0)} ms`)
        }
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    expect(
      slowOrProxied,
      `The following static assets loaded slowly (> 1 s), which usually means they ` +
      `are being processed by the proxy:\n${slowOrProxied.join('\n')}\n\n` +
      `Check the matcher in proxy.ts — it must exclude:\n` +
      `  _next/static, _next/image, favicon.ico, and common image extensions.\n` +
      `Current matcher pattern should be:\n` +
      `  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`,
    ).toHaveLength(0)
  })

  test('proxy does not run on the /api/auth/signout route handler', async ({ page }) => {
    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    // The signout route is an API route — it should respond cleanly
    const response = await page.request.post('/api/auth/signout', {
      headers: { 'Content-Type': 'application/json' },
    })

    expect(
      response.status(),
      `POST /api/auth/signout returned ${response.status()} — expected 200 or 204.\n` +
      `If the proxy is interfering with the signout route it may be re-setting cookies ` +
      `after they are cleared, preventing logout from working.`,
    ).toBeLessThan(400)
  })

  test('proxy sets a cookie on the response for each authenticated dashboard request', async ({ page, context }) => {
    await loginAs(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    // Navigate cold — proxy should run and ensure cookies are present
    const cookiesBefore = await context.cookies()
    const countBefore = cookiesBefore.filter(c => c.name.startsWith('sb-')).length

    await page.goto('/founder/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 10_000 })

    const cookiesAfter = await context.cookies()
    const countAfter = cookiesAfter.filter(c => c.name.startsWith('sb-')).length

    expect(
      countAfter,
      `After a proxy-processed dashboard request, the number of Supabase cookies dropped ` +
      `from ${countBefore} to ${countAfter}.\n` +
      `The proxy's updateSession() must preserve (and potentially refresh) cookies — ` +
      `check that supabaseResponse is returned from proxy.ts and not a plain NextResponse.next().`,
    ).toBeGreaterThanOrEqual(countBefore)
  })

  test('proxy handles concurrent navigation without cookie race conditions', async ({ browser }) => {
    // Open two tabs for the same user and navigate simultaneously
    const context = await browser.newContext()
    const [pageA, pageB] = await Promise.all([context.newPage(), context.newPage()])

    // Log in on tab A
    await loginAs(pageA, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    // Copy cookies to tab B (simulate same session, two tabs)
    const cookies = await context.cookies()
    await context.addCookies(cookies)

    // Navigate both tabs to different routes at the same time
    const results = await Promise.allSettled([
      pageA.goto('/founder/browse').then(() => pageA.waitForLoadState('networkidle', { timeout: 10_000 })),
      pageB.goto('/founder/messages').then(() => pageB.waitForLoadState('networkidle', { timeout: 10_000 })),
    ])

    for (const [idx, result] of results.entries()) {
      expect(
        result.status,
        `Tab ${idx + 1} navigation failed during concurrent access:\n` +
        (result.status === 'rejected' ? String(result.reason) : '') + '\n' +
        `Concurrent proxy runs should not cause cookie races. ` +
        `The refresh_token_reuse_interval in supabase/config.toml prevents token theft ` +
        `but simultaneous refreshes must not log the user out.`,
      ).toBe('fulfilled')
    }

    const urlA = pageA.url()
    const urlB = pageB.url()

    expect(urlA, `Tab A was redirected to login during concurrent navigation: ${urlA}`).not.toMatch(/login/)
    expect(urlB, `Tab B was redirected to login during concurrent navigation: ${urlB}`).not.toMatch(/login/)

    await context.close()
  })

})
