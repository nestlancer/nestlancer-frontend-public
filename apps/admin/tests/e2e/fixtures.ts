import { test as base } from '@playwright/test';

const E2E_ACCESS = 'e2e-mock-access-token';
const E2E_REFRESH = 'e2e-mock-refresh-token';

const mockAdminProfile = {
  status: 'success',
  data: {
    id: 'admin-e2e',
    email: 'operator@nestlancer.test',
    firstName: 'E2E',
    lastName: 'Operator',
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
    twoFactorEnabled: false,
  },
};

/** Pretend the operator is signed in (middleware reads access_token cookie). */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addCookies([
      {
        name: 'access_token',
        value: E2E_ACCESS,
        domain: '127.0.0.1',
        path: '/',
      },
      {
        name: 'refresh_token',
        value: E2E_REFRESH,
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
    await use(context);
  },
  page: async ({ page }, use) => {
    await page.addInitScript(
      ({ access, refresh }) => {
        const expiresAt = Date.now() + 3600_000;
        window.localStorage.setItem('nl.auth.access', access);
        window.localStorage.setItem('nl.auth.refresh', refresh);
        window.localStorage.setItem('nl.auth.expiresAt', String(expiresAt));
      },
      { access: E2E_ACCESS, refresh: E2E_REFRESH }
    );

    await page.route('**/api/v1/users/profile**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: mockAdminProfile });
        return;
      }
      await route.continue();
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
