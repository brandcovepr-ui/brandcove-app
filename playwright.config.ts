import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load test credentials before any test file is evaluated
dotenv.config({ path: path.resolve(__dirname, 'playwright/.env.test') })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Auth tests share cookie state — keep sequential
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on',            // Always capture trace — essential for auth debugging
    screenshot: 'on',       // Screenshot every test result
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Don't restart if already running
    timeout: 120_000,
  },
})
