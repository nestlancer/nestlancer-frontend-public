import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_WEB_BASE_URL ?? 'http://127.0.0.1:9000';
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
    },
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: 'pnpm dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_API_URL: baseURL,
          NEXT_PUBLIC_API_PROXY: 'true',
        },
      },
});
