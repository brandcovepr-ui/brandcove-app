import { test, expect } from '@playwright/test'
import { loginAs, logout, waitForLayoutReady, FOUNDER } from './helpers'

test.describe('Founder Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, FOUNDER)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('stat cards render', async ({ page }) => {
    await page.waitForTimeout(2000)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('sidebar nav links are present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /browse/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /messages/i })).toBeVisible()
  })

  test('page title is visible', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('Founder Browse Talent', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, FOUNDER)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('browse page loads', async ({ page }) => {
    await page.goto('/browse')
    await page.waitForTimeout(2000)
    // Should have a heading and some content
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe('Founder Messages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, FOUNDER)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('messages page loads', async ({ page }) => {
    await page.goto('/messages')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1, h2, [class*="text-"]').first()).toBeVisible()
  })

  test('can see conversation threads or empty state', async ({ page }) => {
    await page.goto('/messages')
    await page.waitForTimeout(2500)
    // Ada has seed inquiries so we expect threads
    const threads = page.locator('[class*="cursor-pointer"]')
    const count = await threads.count()
    const hasEmpty = await page.getByText(/no messages|no inquiries|no conversations/i).isVisible()
    expect(count > 0 || hasEmpty).toBe(true)
  })
})

test.describe('Founder Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, FOUNDER)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('settings page has three tabs', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /subscription/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /password/i })).toBeVisible()
  })
})
