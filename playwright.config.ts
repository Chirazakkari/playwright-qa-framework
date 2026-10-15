import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const AI_URL = process.env.AI_URL ?? 'http://localhost:4010';

/**
 * Two independent projects:
 *  - "api": pure HTTP tests, no browser started (fast feedback)
 *  - "e2e": browser tests against the Swag Labs demo shop
 * Both public targets are practice sites, so the suite keeps request volume low.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: isCI ? [['blob'], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    // Swag Labs exposes its hooks as data-test, not data-testid.
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_URL ?? 'https://restful-booker.herokuapp.com',
      },
    },
    {
      name: 'e2e',
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
      },
    },
    {
      name: 'ai-api',
      testMatch: /tests\/ai\/(chatbot|mcp)\.spec\.ts/,
      use: { baseURL: AI_URL },
    },
    {
      name: 'ai-ui',
      testMatch: /tests\/ai\/widget\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: AI_URL },
    },
  ],
  // Fully local, fictional assistant used as an AI/MCP test target (see mock-ai/).
  webServer: {
    command: 'npx tsx mock-ai/server.ts',
    url: AI_URL + '/health',
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
});
