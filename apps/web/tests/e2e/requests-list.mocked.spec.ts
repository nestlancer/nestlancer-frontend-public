import { expect, test } from './fixtures';
import {
  fulfillCommonWebRoutes,
  makeRequestItem,
  paginatedRequests,
  statsPayload,
  userProfile,
} from './api-mocks';

test.describe('Requests list states (mocked API)', () => {
  test('shows empty state when no requests exist', async ({ page }) => {
    await page.route(/\/api\/v1\//, async (route) => {
      const handled = await fulfillCommonWebRoutes(route, {
        onRequests: async () => {
          await route.fulfill({ status: 200, json: paginatedRequests([], 0) });
        },
        onProjects: async () => {
          await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
        },
      });
      if (!handled) await route.continue();
    });

    await page.goto('/requests');
    await expect(page.getByRole('heading', { name: 'Work Hub' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('No work items yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'New request' }).first()).toBeVisible();
  });

  test('shows error state when requests API fails', async ({ page }) => {
    await page.route(/\/api\/v1\//, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/users/profile')) {
        await route.fulfill({ status: 200, json: userProfile });
        return;
      }
      if (url.pathname.includes('/notifications/unread')) {
        await route.fulfill({ status: 200, json: { status: 'success', data: { count: 0 } } });
        return;
      }
      if (url.pathname.includes('/requests/stats')) {
        await route.fulfill({ status: 200, json: statsPayload });
        return;
      }
      if (url.pathname.includes('/requests')) {
        await route.fulfill({
          status: 500,
          json: { status: 'error', message: 'Mocked requests failure' },
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/requests');
    await expect(page.getByText('Could not load work items.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('paginates with server page param', async ({ page }) => {
    const capturedPages: number[] = [];

    await page.route(/\/api\/v1\//, async (route) => {
      const handled = await fulfillCommonWebRoutes(route, {
        onRequests: async (url) => {
          const pageNum = Number(url.searchParams.get('page') || '1');
          capturedPages.push(pageNum);
          const item = makeRequestItem(`req-p${pageNum}`, `Request page ${pageNum}`);
          await route.fulfill({
            status: 200,
            json: paginatedRequests([item], 25, pageNum, 12),
          });
        },
        onProjects: async () => {
          await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
        },
      });
      if (!handled) await route.continue();
    });

    await page.goto('/requests');
    await expect(page.getByText('Request page 1')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Showing 1–12 of 25')).toBeVisible();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText('Request page 2')).toBeVisible({ timeout: 15_000 });
    expect(capturedPages).toContain(1);
    expect(capturedPages).toContain(2);
  });

  test('syncs status filter to URL and API query', async ({ page }) => {
    let lastStatus: string | null = null;

    await page.route(/\/api\/v1\//, async (route) => {
      const handled = await fulfillCommonWebRoutes(route, {
        onRequests: async (url) => {
          lastStatus = url.searchParams.get('status');
          await route.fulfill({
            status: 200,
            json: paginatedRequests([makeRequestItem('req-1', 'Quoted request', 'quoted')], 1),
          });
        },
        onProjects: async () => {
          await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
        },
      });
      if (!handled) await route.continue();
    });

    await page.goto('/requests');
    await expect(page.getByRole('heading', { name: 'Work Hub' })).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Filter by status').selectOption('quoted');
    await expect.poll(() => new URL(page.url()).searchParams.get('status')).toBe('quoted');
    await expect.poll(() => lastStatus).toBe('quoted');
  });

  test('syncs search query to URL and API', async ({ page }) => {
    let lastQuery: string | null = null;

    await page.route(/\/api\/v1\//, async (route) => {
      const handled = await fulfillCommonWebRoutes(route, {
        onRequests: async (url) => {
          lastQuery = url.searchParams.get('q');
          await route.fulfill({
            status: 200,
            json: paginatedRequests([makeRequestItem('req-search', 'Mobile app')], 1),
          });
        },
        onProjects: async () => {
          await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
        },
      });
      if (!handled) await route.continue();
    });

    await page.goto('/requests');
    await page.getByLabel('Search work items').fill('mobile');
    await expect
      .poll(() => new URL(page.url()).searchParams.get('q'), { timeout: 10_000 })
      .toBe('mobile');
    await expect.poll(() => lastQuery).toBe('mobile');
    await expect(page.getByText('Mobile app')).toBeVisible({ timeout: 15_000 });
  });
});
