import { test, expect, type Page } from '@playwright/test'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function loginAsFounder(page: Page) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(process.env.TEST_FOUNDER_EMAIL!)
  await page.locator('input[type="password"]').fill(process.env.TEST_FOUNDER_PASSWORD!)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(/founder\/dashboard/, { timeout: 15_000 }).catch(() => {
    throw new Error(
      `Founder login did not redirect to /founder/dashboard.\n` +
      `Current URL: ${page.url()}\n` +
      `Check TEST_FOUNDER_EMAIL/PASSWORD in playwright/.env.test and that the ` +
      `account has role=founder and is fully onboarded with an active subscription.`,
    )
  })
}

async function loginAsCreative(page: Page) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(process.env.TEST_CREATIVE_EMAIL!)
  await page.locator('input[type="password"]').fill(process.env.TEST_CREATIVE_PASSWORD!)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(/creator\/dashboard/, { timeout: 15_000 }).catch(() => {
    throw new Error(
      `Creative login did not redirect to /creator/dashboard.\n` +
      `Current URL: ${page.url()}\n` +
      `Check TEST_CREATIVE_EMAIL/PASSWORD in playwright/.env.test and that the ` +
      `account has role=creative and is approved with an active subscription.`,
    )
  })
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('Founder dashboard auth', () => {

  test('founder can access their dashboard after login', async ({ page }) => {
    await loginAsFounder(page)

    await expect(
      page,
      'After login the founder should land on /founder/dashboard',
    ).toHaveURL(/founder\/dashboard/)

    // The page heading "Welcome back" or "Dashboard" should be visible
    await expect(
      page.locator('h1').first(),
      'A page heading should be visible on the founder dashboard',
    ).toBeVisible({ timeout: 8_000 })
  })

  test('all founder dashboard pages load without auth errors', async ({ page }) => {
    await loginAsFounder(page)

    const routes = [
      '/founder/dashboard',
      '/founder/browse',
      '/founder/shortlist',
      '/founder/messages',
      '/founder/settings',
    ]

    for (const route of routes) {
      const authErrors: string[] = []

      const handler = (response: { status: () => number; url: () => string }) => {
        if (
          (response.status() === 401 || response.status() === 403) &&
          (response.url().includes('supabase') || response.url().includes('/api/'))
        ) {
          authErrors.push(`${response.status()} — ${response.url()}`)
        }
      }
      page.on('response', handler)

      await page.goto(route)
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
        page.off('response', handler)
        throw new Error(
          `Route ${route} did not reach networkidle within 10 s.\n` +
          `This is the "loading forever" bug. Most likely cause: a server component or ` +
          `data-fetching hook is stalled due to an auth/session error on this route.\n` +
          `Auth errors captured: ${authErrors.join(', ') || 'none'}`,
        )
      })

      page.off('response', handler)

      expect(
        authErrors,
        `Auth errors (401/403) on founder route ${route}:\n${authErrors.join('\n')}\n\n` +
        `Check that:\n` +
        `  - The server layout for this route uses getClaims() not getSession()\n` +
        `  - lib/supabase/server.ts reads cookies from the Next.js cookie store\n` +
        `  - The proxy has run and written fresh cookies before this route renders`,
      ).toHaveLength(0)

      expect(
        page.url(),
        `Visiting ${route} redirected away unexpectedly to ${page.url()}`,
      ).toMatch(new RegExp(route.replace(/\//g, '\\/')))

      // No infinite spinners after networkidle
      const spinnerCount = await page.locator('.animate-spin').count()
      expect(
        spinnerCount,
        `${spinnerCount} loading spinner(s) still active on ${route} after networkidle. ` +
        `A data fetch is hanging — likely an auth or staleTime issue.`,
      ).toBe(0)
    }
  })

  test('sidebar navigation links are all present', async ({ page }) => {
    await loginAsFounder(page)

    const expectedLinks = [
      { name: /dashboard/i, description: 'Dashboard link' },
      { name: /browse/i, description: 'Browse Talent link' },
      { name: /shortlist/i, description: 'Shortlist link' },
      { name: /messages|inquiries/i, description: 'Messages/Inquiries link' },
      { name: /settings/i, description: 'Settings link' },
    ]

    for (const { name, description } of expectedLinks) {
      await expect(
        page.getByRole('link', { name }).first(),
        `${description} should be visible in the founder sidebar`,
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('a creative user cannot access founder routes — role guard redirects', async ({ page }) => {
    await loginAsCreative(page)

    // Attempt to directly navigate to a founder-only route
    await page.goto('/founder/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 10_000 })

    expect(
      page.url(),
      `A creative user navigated directly to /founder/dashboard and was NOT redirected.\n` +
      `The founder dashboard layout must fetch the user's role (from getClaims() claims or ` +
      `from the profiles table) and redirect if role !== 'founder'.\n` +
      `Current URL: ${page.url()}`,
    ).not.toMatch(/founder\/dashboard$/)
  })

  test('founder cannot access creator routes — role guard redirects', async ({ page }) => {
    await loginAsFounder(page)

    await page.goto('/creator/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 10_000 })

    expect(
      page.url(),
      `A founder user navigated to /creator/dashboard and was NOT redirected.\n` +
      `The creator dashboard layout must redirect if role !== 'creative'.\n` +
      `Current URL: ${page.url()}`,
    ).not.toMatch(/creator\/dashboard$/)
  })

  test('browse page displays talent grid or empty state — no crash', async ({ page }) => {
    await loginAsFounder(page)
    await page.goto('/founder/browse')
    await page.waitForLoadState('networkidle', { timeout: 10_000 })

    // Either a grid of cards or an empty state heading must be visible
    const grid = page.locator('[class*="grid"]').first()
    const emptyHeading = page.getByText(/no talent|no creatives|no results/i)
    const heading = page.locator('h1, h2').first()

    const something = await Promise.race([
      grid.isVisible().then(v => v),
      emptyHeading.isVisible().then(v => v),
      heading.isVisible().then(v => v),
    ])

    expect(
      something,
      `The browse page at /founder/browse rendered nothing — no grid, no empty state, no heading.\n` +
      `This usually means the data fetch crashed silently. Check the browser console in the trace.`,
    ).toBeTruthy()
  })

  test('settings page has all three tabs', async ({ page }) => {
    await loginAsFounder(page)
    await page.goto('/founder/settings')
    await page.waitForLoadState('networkidle', { timeout: 10_000 })

    await expect(
      page.getByRole('button', { name: /edit profile/i }),
      'Edit Profile tab should be visible on settings page',
    ).toBeVisible({ timeout: 8_000 })

    await expect(
      page.getByRole('button', { name: /subscription/i }),
      'Subscription tab should be visible on settings page',
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: /password/i }),
      'Change Password tab should be visible on settings page',
    ).toBeVisible()
  })

})
