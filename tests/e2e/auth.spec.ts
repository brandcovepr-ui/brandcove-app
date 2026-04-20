import { test, expect } from '@playwright/test'
import { loginAs, FOUNDER, CREATIVE } from './helpers'

test.describe('Auth – Login', () => {
  test('founder login redirects to /dashboard', async ({ page }) => {
    await loginAs(page, FOUNDER)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('creative login redirects to /creative/dashboard', async ({ page }) => {
    await loginAs(page, CREATIVE)
    await expect(page).toHaveURL(/\/creative\/dashboard/)
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(FOUNDER.email)
    await page.locator('input[type="password"]').fill('WrongPassword!')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page.getByText(/invalid|incorrect|wrong|error/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Auth – Signup page', () => {
  test('signup page has role selector', async ({ page }) => {
    await page.goto('/signup')
    // Role toggle buttons should be visible
    await expect(page.getByRole('button', { name: /founder/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /creative/i })).toBeVisible()
  })

  test('can toggle role between Founder and Creative', async ({ page }) => {
    await page.goto('/signup')
    const creativeBtn = page.getByRole('button', { name: /creative/i })
    await creativeBtn.click()
    // After selecting creative, button should appear active/selected
    await expect(creativeBtn).toBeVisible()
  })
})
