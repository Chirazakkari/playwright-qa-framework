import { defineConfig, devices } from '@playwright/test';

/**
 * Demo run: one real purchase, slowed down and recorded.
 *   npm run demo
 * The video lands in test-results/ (retained even on success).
 */
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    viewport: { width: 1280, height: 720 },
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    launchOptions: { slowMo: 700 },
  },
});
