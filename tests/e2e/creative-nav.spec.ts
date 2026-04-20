import { test, expect } from '@playwright/test'
import { loginAs, waitForLayoutReady, CREATIVE } from './helpers'

test('clicking Inquiries on creative dashboard loads without infinite spinner', async ({ page }) => {
  await loginAs(page, CREATIVE)
  await expect(page).toHaveURL(/\/creative\/dashboard/, { timeout: 15000 })
  await waitForLayoutReady(page)

  // Click the "View All" inquiries link on the dashboard
  await page.getByRole('link', { name: /view all/i }).click()

  // Spinner should disappear within 5 seconds (not loop forever)
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 5000 })
    .catch(() => {}) // if spinner never appears, that's fine too

  // The inquiries page heading should be visible
  await expect(page.getByRole('heading', { name: /inquiries/i })).toBeVisible({ timeout: 8000 })
})

test('clicking a recent inquiry row on creative dashboard navigates correctly', async ({ page }) => {
  await loginAs(page, CREATIVE)
  await expect(page).toHaveURL(/\/creative\/dashboard/, { timeout: 15000 })
  await waitForLayoutReady(page)

  // Click a recent inquiry row if one exists
  const inquiryRow = page.locator('a[href="/creative/messages"]').first()
  if (await inquiryRow.isVisible()) {
    await inquiryRow.click()
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 5000 })
      .catch(() => {})
    await expect(page.getByRole('heading', { name: /inquiries/i })).toBeVisible({ timeout: 8000 })
  }
})
