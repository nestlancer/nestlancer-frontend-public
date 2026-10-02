import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Pipeline hubs (live API)', () => {
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.getByLabel('Password').fill(adminPassword!);
    await page.getByRole('button', { name: 'Enter console' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test('stage pipeline renders tabs and pipeline sections', async ({ page }) => {
    await page.goto('/pipeline');
    await expect(page.getByRole('tab', { name: 'Stage pipeline' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'User hub' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Project hub' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pipelines' })).toBeVisible({ timeout: 20_000 });
  });

  test('user hub detail loads scoped data for seeded user', async ({ page }) => {
    await page.goto('/pipeline/users/test-user-001');
    await expect(page.getByRole('heading', { name: 'User hub' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Open requests')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Jordan')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Requests', { exact: true }).first()).toBeVisible();
  });

  test('project hub detail loads scoped data for seeded project', async ({ page }) => {
    await page.goto('/pipeline/projects/test-project-001');
    await expect(page.getByRole('heading', { name: 'Project hub' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Progress')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('E-Commerce Platform')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Milestone loop (E2E steps 11–17)')).toBeVisible();
  });
});
