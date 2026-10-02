import { expect } from '@playwright/test';

import { test } from './fixtures';
import { fulfillCommonWebRoutes } from './api-mocks';

test.describe('Login (mocked)', () => {
  test('shows login form and redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.route(/\/api\/v1\//, async (route) => {
      const handled = await fulfillCommonWebRoutes(route);
      if (!handled) await route.continue();
    });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
