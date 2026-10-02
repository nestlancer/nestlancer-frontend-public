import { expect, test } from '@playwright/test';

test('admin login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter console' })).toBeVisible();
});
