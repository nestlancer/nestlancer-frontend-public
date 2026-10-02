import type { Page, Route } from '@playwright/test';

const emptyBlogList = {
  items: [],
  totalItems: 0,
  page: 1,
  limit: 12,
  totalPages: 0,
};

const emptyTimeline = { items: [] };

/** Stable mock payloads for public marketing pages (visual regression). */
export async function mockPublicPageApis(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.includes('/users/profile')) {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      return;
    }

    if (path.includes('/portfolio/featured')) {
      await route.fulfill({ status: 200, json: { data: [] } });
      return;
    }

    if (path.includes('/portfolio/categories')) {
      await route.fulfill({
        status: 200,
        json: {
          data: [
            { id: '1', name: 'Web Development', slug: 'web-development' },
            { id: '2', name: 'UI/UX Design', slug: 'ui-ux' },
          ],
        },
      });
      return;
    }

    if (path.includes('/portfolio/timeline')) {
      await route.fulfill({ status: 200, json: emptyTimeline });
      return;
    }

    if (/\/portfolio\/?$/.test(path)) {
      await route.fulfill({
        status: 200,
        json: { items: [], totalItems: 0, page: 1, limit: 48, totalPages: 0 },
      });
      return;
    }

    if (path.includes('/blog/categories')) {
      await route.fulfill({
        status: 200,
        json: {
          data: [
            { id: '1', name: 'Technology', slug: 'technology', postCount: 2 },
            { id: '2', name: 'Hiring', slug: 'hiring', postCount: 1 },
          ],
        },
      });
      return;
    }

    if (path.includes('/blog/posts')) {
      await route.fulfill({ status: 200, json: emptyBlogList });
      return;
    }

    if (path.includes('/notifications/')) {
      await route.fulfill({ status: 200, json: { status: 'success', data: { count: 0 } } });
      return;
    }

    await route.continue();
  });
}

export const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

export const PUBLIC_PAGES = [
  { path: '/', slug: 'homepage' },
  { path: '/blog', slug: 'blog' },
  { path: '/portfolio', slug: 'portfolio' },
  { path: '/contact', slug: 'contact' },
] as const;

/** Prepare page for deterministic layout screenshots. */
export async function prepareVisualPage(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
}
