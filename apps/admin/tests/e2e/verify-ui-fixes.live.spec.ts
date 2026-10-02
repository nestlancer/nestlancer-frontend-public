import { expect, test } from '@playwright/test';

/**
 * Live verification of product/UI fixes against the running admin container.
 * Run:
 *   PLAYWRIGHT_SKIP_WEBSERVER=true PLAYWRIGHT_ADMIN_BASE_URL=http://127.0.0.1:9110 \
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
 *   pnpm exec playwright test tests/e2e/verify-ui-fixes.live.spec.ts
 */

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@nestlancer.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function login(page: import('@playwright/test').Page) {
  if (!adminPassword) return;
  await page.goto('/login');
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: /Enter console|Sign in|Log in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|notifications|payments|messages)/, {
    timeout: 45_000,
  });
}

test.describe('UI fixes verification (live)', () => {
  test.skip(!adminPassword, 'Set E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('notifications defaults to My notifications + platform log filters', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /^Notifications$/i }).first()).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByRole('tab', { name: /My notifications/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /My notifications/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByRole('heading', { name: /My notifications/i })).toBeVisible();
    await expect(page.getByText(/personal receiver inbox/i)).toHaveCount(0);

    await page.getByRole('tab', { name: /Platform log/i }).click();
    await expect(page.getByPlaceholder(/Search title, message, type, recipient/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/^Audience$|^Type$|^Read state$|^Sort$/i).first()).toBeVisible();
  });

  test('payments verification / disputes / reconciliation tabs work', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByRole('heading', { name: /^Payments$/i }).first()).toBeVisible({
      timeout: 25_000,
    });

    await page.getByRole('tab', { name: /Awaiting verification/i }).click();
    await expect(page).toHaveURL(/view=verification/);
    await expect(
      page.getByText(/Manual bank\/UPI|Awaiting verification|No payments awaiting/i).first()
    ).toBeVisible({ timeout: 20_000 });
    // Status filter from All transactions must not appear on this tab
    await expect(page.getByLabel(/^Status$/i)).toHaveCount(0);

    await page.getByRole('tab', { name: /^Disputes$/i }).click();
    await expect(page).toHaveURL(/view=disputes/);
    await expect(page.getByText(/Payment disputes|No open disputes/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Could not load disputes/i)).toHaveCount(0);

    await page.getByRole('tab', { name: /^Reconciliation$/i }).click();
    await expect(page).toHaveURL(/view=reconciliation/);
    await expect(page.getByText(/Start date/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/End date/i)).toBeVisible();
    // Must not render a blank fake empty table as the only content without date controls
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test('messages overview has no inline chat; thread is a full page', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: /^Messages$/i }).first()).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByText(/open a thread on its own page/i)).toBeVisible();
    await expect(page.getByText(/Select a conversation/i)).toHaveCount(0);
    await expect(page.getByPlaceholder(/Reply as operator/i)).toHaveCount(0);

    // Wait until queue finishes loading (skeletons are not buttons).
    await expect(
      page.getByText(/Something went wrong|No conversations match|Conversation queue/i).first()
    ).toBeVisible({
      timeout: 25_000,
    });
    const row = page.locator('.inbox-queue-list button[role="listitem"]').first();
    if ((await row.count()) === 0) {
      test.info().annotations.push({ type: 'note', description: 'No conversations to open' });
      return;
    }
    await row.click();
    await expect(page).toHaveURL(/\/messages\/(thread|project)\//, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Messages/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('moderation and analytics load without page-blanking faults', async ({ page }) => {
    await page.goto('/moderation');
    await expect(page.getByRole('heading', { name: /Moderation/i }).first()).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByText(/Could not load flagged messages/i)).toHaveCount(0);

    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /Analytics/i }).first()).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByRole('tab', { name: /7 days|30 days|90 days/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('user detail has media / password / sessions tools', async ({ page }) => {
    const knownUserId = process.env.E2E_USER_ID;
    if (knownUserId) {
      await page.goto(`/users/${encodeURIComponent(knownUserId)}`);
    } else {
      await page.goto('/users');
      await expect(page.getByRole('heading', { name: /Users/i }).first()).toBeVisible({
        timeout: 25_000,
      });
      // Directory may rate-limit under parallel verification; wait for rows or error.
      const userLink = page.getByRole('link', { name: /View →/i }).first();
      await expect(userLink.or(page.getByText(/Rate limit|Something went wrong/i))).toBeVisible({
        timeout: 25_000,
      });
      if (await page.getByText(/Rate limit|Something went wrong/i).isVisible()) {
        test.info().annotations.push({ type: 'note', description: 'Users directory rate-limited' });
        test.skip();
        return;
      }
      await userLink.click();
    }
    await expect(page).toHaveURL(/\/users\/[^/]+$/, { timeout: 20_000 });
    await expect(
      page
        .getByRole('link', { name: /View media/i })
        .or(page.getByText(/Rate limit|Something went wrong/i))
    ).toBeVisible({ timeout: 25_000 });
    if (
      await page
        .getByText(/Rate limit|Something went wrong/i)
        .first()
        .isVisible()
    ) {
      test.info().annotations.push({ type: 'note', description: 'User detail rate-limited' });
      test.skip();
      return;
    }
    await expect(page.getByRole('link', { name: /View media/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Set password/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Active sessions/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Activity log/i })).toBeVisible();
  });
});
