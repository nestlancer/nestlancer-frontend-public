import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

/** Routes that must load without a full-page error state after login. */
const DASHBOARD_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/dashboard', heading: /Dashboard|Overview/i },
  { path: '/users', heading: /Users directory|Users/i },
  { path: '/requests', heading: /Requests/i },
  { path: '/quotes', heading: /Quotes/i },
  { path: '/projects', heading: /Projects/i },
  { path: '/payments', heading: /Payments/i },
  { path: '/messages', heading: /Messages|Inbox/i },
  { path: '/moderation', heading: /Moderation|Flagged/i },
  { path: '/contact', heading: /Inquiries|Contact/i },
  { path: '/analytics', heading: /Analytics/i },
  { path: '/portfolio', heading: /Portfolio/i },
  { path: '/content', heading: /Blog/i },
  { path: '/media', heading: /Media/i },
  { path: '/system', heading: /System Config/i },
  { path: '/integrations', heading: /Webhooks|Integrations/i },
  { path: '/audit', heading: /Audit Logs/i },
  { path: '/pipeline', heading: /Pipelines/i },
  { path: '/notifications', heading: /Notifications/i },
];

test.describe('Admin console pages (live API)', () => {
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: 'Enter console' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  for (const { path, heading } of DASHBOARD_ROUTES) {
    test(`${path} loads primary content`, async ({ page }) => {
      const failedResponses: string[] = [];
      page.on('response', (res) => {
        const url = res.url();
        if (!url.includes('/api/v1/')) return;
        if (res.status() < 500) return;
        // Shared layout fetches dashboard widgets on every route — ignore those
        // unless we are specifically testing /dashboard.
        if (path !== '/dashboard' && url.includes('/admin/dashboard/')) return;
        failedResponses.push(`${res.status()} ${url}`);
      });

      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
        timeout: 25_000,
      });
      await expect(page.getByText(/Could not load|Something went wrong/i)).toHaveCount(0);
      expect(failedResponses, `5xx on ${path}`).toEqual([]);
    });
  }

  test('system page notification templates slice does not fault', async ({ page }) => {
    await page.goto('/system');
    await expect(page.getByRole('heading', { name: /System Config/i })).toBeVisible({
      timeout: 20_000,
    });
    const notifFault = page.getByText(/Notifications.*failed|notification templates.*error/i);
    await expect(notifFault).toHaveCount(0);
  });
});
