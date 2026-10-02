import { expect, test } from './fixtures';

const mockUsers = {
  status: 'success',
  data: {
    data: [
      {
        id: 'user-1',
        email: 'alpha@example.com',
        firstName: 'Alpha',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user-2',
        email: 'beta@example.com',
        firstName: 'Beta',
        lastName: 'User',
        role: 'USER',
        status: 'SUSPENDED',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
      },
    ],
    pagination: { page: 1, limit: 20, total: 42, totalPages: 3 },
  },
};

test.describe('Admin users (mocked API)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/admin/users**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: mockUsers });
        return;
      }
      await route.continue();
    });
  });

  test('users list shows server pagination', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByText('All users — page 1 of 3 (42 total)', { exact: true })).toBeVisible(
      { timeout: 15_000 }
    );
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  test('user detail shows role control and export action', async ({ page }) => {
    await page.route('**/api/v1/admin/users/user-1', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        json: {
          status: 'success',
          data: {
            ...mockUsers.data.data[0],
            id: 'user-1',
            avatar: null,
            phone: null,
            marketingConsent: false,
            lastLoginAt: null,
            deletedAt: null,
            updatedAt: new Date().toISOString(),
            mustChangePassword: false,
          },
        },
      });
    });

    await page.route('**/api/v1/admin/users/user-1/sessions**', async (route) => {
      await route.fulfill({ status: 200, json: { status: 'success', data: { data: [] } } });
    });

    await page.route('**/api/v1/admin/users/user-1/activity**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: 'success',
          data: { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } },
        },
      });
    });

    await page.route('**/api/v1/admin/users?*', async (route) => {
      if (route.request().url().includes('role=ADMIN')) {
        await route.fulfill({
          status: 200,
          json: {
            status: 'success',
            data: { data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } },
          },
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/users/user-1');
    await expect(page.getByRole('heading', { name: 'Access' })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('label').filter({ hasText: 'Role' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export data' })).toBeVisible();
  });
});
