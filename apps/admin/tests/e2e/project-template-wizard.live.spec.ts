import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Project template wizard (live API)', () => {
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: 'Enter console' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test('opens wizard and loads duplicate preview', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Project Console' })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: 'Use as template' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Use project as template')).toBeVisible();
    await expect(dialog.getByText('Loading template…')).toBeHidden({ timeout: 25_000 });
    await expect(dialog.getByText('Client for new project')).toBeVisible();
    await expect(dialog.getByText('Template from client')).toBeVisible();
    await expect(dialog.getByText(/braj/i)).toBeVisible();
  });
});
