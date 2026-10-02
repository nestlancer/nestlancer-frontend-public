import { expect, test } from './fixtures';

test.describe('Admin command palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/v1\/users\/profile/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: 'success',
          data: {
            id: 'admin-1',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
          },
        },
      });
    });
  });

  test('opens with keyboard shortcut and navigates to Users', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await expect(page.getByLabel('Command search')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('option', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/users$/);
  });

  test('can be disabled via feature flag env', async ({ page }) => {
    test.skip(
      process.env.NEXT_PUBLIC_FEATURE_COMMAND_PALETTE_ADMIN !== 'false',
      'Set NEXT_PUBLIC_FEATURE_COMMAND_PALETTE_ADMIN=false when starting admin dev server'
    );

    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await expect(page.getByLabel('Command search')).toHaveCount(0);
  });
});
