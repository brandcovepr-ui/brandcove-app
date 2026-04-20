import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
// Local Supabase dev service role key (safe to use in tests only)
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const INACTIVE_CREATIVE_ID = '66666666-6666-6666-6666-666666666666'

test.describe('Creative Pending Review', () => {
  test.beforeAll(async () => {
    // Reset inactive@creative.io to seed state so test is deterministic
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await admin.from('profiles').update({
      onboarding_complete: false,
      review_status: 'pending',
      subscription_status: 'inactive',
    }).eq('id', INACTIVE_CREATIVE_ID)
  })

  test('inactive creative sees pending-review or onboarding page', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('inactive@creative.io')
    await page.locator('input[type="password"]').fill('TestPassword123!')
    await page.getByRole('button', { name: /log in/i }).click()
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
    // Should land on /creative (onboarding not complete) or /creative/pending-review
    const url = page.url()
    expect(
      url.includes('/creative/pending-review') ||
      (url.includes('/creative') && !url.includes('/dashboard'))
    ).toBe(true)
  })
})

test.describe('Subscribe page', () => {
  test('subscribe page shows pricing', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('ada@buildng.com')
    await page.locator('input[type="password"]').fill('TestPassword123!')
    await page.getByRole('button', { name: /log in/i }).click()
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })

    await page.goto('/subscribe')
    await expect(page.getByText('₦3,000', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /pay|subscribe/i })).toBeVisible()
  })
})
