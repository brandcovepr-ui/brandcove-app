import { Page } from '@playwright/test'

export const FOUNDER = { email: 'ada@buildng.com', password: 'TestPassword123!' }
export const CREATIVE = { email: 'tunde@creative.io', password: 'TestPassword123!' }

export async function loginAs(page: Page, user: { email: string; password: string }) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
}

export async function waitForLayoutReady(page: Page) {
  // Wait for the loading spinner to disappear (layout guard resolved)
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Spinner may not exist at all if page loaded quickly — that's fine
  })
}

export async function logout(page: Page) {
  await page.goto('/login')
}
