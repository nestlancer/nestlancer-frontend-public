import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_ADMIN_BASE_URL ?? 'http://127.0.0.1:9010';
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
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
