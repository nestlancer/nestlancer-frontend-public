import { test as base } from '@playwright/test';

/**
 * Pretend the user is signed in:
 * - middleware reads access_token / refresh_token cookies
 * - SessionBootstrap silent-refresh + maintenance check are fulfilled so
 *   WebAuthGuard can leave the loading state without hitting a real gateway
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addCookies([
      {
        name: 'access_token',
        value: 'e2e-mock-access-token',
        domain: '127.0.0.1',
        path: '/',
      },
      {
        name: 'refresh_token',
        value: 'e2e-mock-refresh-token',
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
    await use(context);
  },
  page: async ({ page }, use) => {
    await page.route(/\/api\/auth\/refresh/, async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        json: {
          status: 'success',
          data: {
            accessToken: 'e2e-mock-access-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
            refreshToken: 'e2e-mock-refresh-token',
          },
        },
      });
    });

    await page.route(/\/api\/v1\/system\/status/, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: 'success',
          data: {
            maintenance: { enabled: false, message: null, estimatedEnd: null },
          },
        },
      });
    });

    await page.route(/\/(?:api\/v1\/)?users\/profile/, async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        json: {
          status: 'success',
          data: {
            id: 'user-1',
            email: 'web-e2e@example.com',
            firstName: 'Web',
            lastName: 'User',
            phone: '+919876543210',
            role: 'USER',
          },
        },
      });
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
