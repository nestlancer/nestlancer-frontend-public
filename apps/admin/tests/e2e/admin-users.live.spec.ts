import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Admin users (live API)', () => {
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: 'Enter console' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test('users list loads with pagination controls', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users Management' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('can open first user from list', async ({ page }) => {
    await page.goto('/users');
    const viewLink = page.getByRole('link', { name: 'View' }).first();
    await expect(viewLink).toBeVisible({ timeout: 20_000 });
    await viewLink.click();
    await expect(page).toHaveURL(/\/users\/[^/]+/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Access' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'Edit profile' })).toBeVisible();
  });
});
