import { test, expect } from '@playwright/test'
import { loginAs, logout, waitForLayoutReady, CREATIVE } from './helpers'

test.describe('Creative Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREATIVE)
    await expect(page).toHaveURL(/\/creative\/dashboard/, { timeout: 15000 })
    await waitForLayoutReady(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('dashboard page renders heading', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('sidebar has Dashboard link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible()
  })

  test('sidebar has Inquiries or Messages link', async ({ page }) => {
    const link = page.getByRole('link', { name: /inquiries|messages/i })
    await expect(link).toBeVisible()
  })

  test('sidebar has Profile link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible()
  })
})

test.describe('Creative Messages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREATIVE)
    await expect(page).toHaveURL(/\/creative\/dashboard/, { timeout: 15000 })
    await waitForLayoutReady(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('messages page loads', async ({ page }) => {
    // Use client-side navigation via sidebar link to avoid layout re-initialization
    await page.getByRole('link', { name: /inquiries|messages/i }).click()
    await waitForLayoutReady(page)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('shows conversations or empty state', async ({ page }) => {
    await page.getByRole('link', { name: /inquiries|messages/i }).click()
    await waitForLayoutReady(page)
    await page.waitForTimeout(2000)
    const threads = page.locator('button[class*="cursor-pointer"], button[class*="flex items-center gap-3"]')
    const count = await threads.count()
    const hasEmpty = await page.getByText(/no inquiries|no messages/i).isVisible()
    expect(count > 0 || hasEmpty).toBe(true)
  })
})

test.describe('Creative Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREATIVE)
    await expect(page).toHaveURL(/\/creative\/dashboard/, { timeout: 15000 })
    await waitForLayoutReady(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('profile page loads', async ({ page }) => {
    await page.getByRole('link', { name: /profile/i }).click()
    await waitForLayoutReady(page)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Creative Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, CREATIVE)
    await expect(page).toHaveURL(/\/creative\/dashboard/, { timeout: 15000 })
    await waitForLayoutReady(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('settings page has three tabs', async ({ page }) => {
    await page.getByRole('link', { name: /settings/i }).click()
    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: /subscription/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /password/i })).toBeVisible()
  })
})
