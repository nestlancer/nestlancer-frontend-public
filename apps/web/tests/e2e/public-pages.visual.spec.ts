import { expect, test } from '@playwright/test';

import { mockPublicPageApis, prepareVisualPage, PUBLIC_PAGES, VIEWPORTS } from './public-api-mocks';

test.describe('public pages — layout snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await mockPublicPageApis(page);
    await prepareVisualPage(page);
  });

  for (const { path, slug } of PUBLIC_PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${slug} @ ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path, { waitUntil: 'networkidle' });

        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

        await expect(page).toHaveScreenshot(`${slug}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.03,
        });
      });
    }
  }
});
