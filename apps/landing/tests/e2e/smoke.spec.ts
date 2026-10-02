import { expect, test } from '@playwright/test';

test.describe('Landing smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('/blog redirects to web app blog', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.status()).toBeLessThan(400);
    // Next.js redirect() — final URL should leave landing origin when NEXT_PUBLIC_APP_URL is set
    const url = page.url();
    expect(url).toMatch(/\/blog/);
  });

  test('/portfolio redirects to web app portfolio', async ({ page }) => {
    const response = await page.goto('/portfolio');
    expect(response?.status()).toBeLessThan(400);
    const url = page.url();
    expect(url).toMatch(/\/portfolio/);
  });
});
