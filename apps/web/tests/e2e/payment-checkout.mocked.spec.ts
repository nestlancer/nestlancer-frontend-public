import { expect } from '@playwright/test';

import { test } from './fixtures';
import { fulfillCommonWebRoutes, userProfile } from './api-mocks';

function makePaymentDetail(id: string) {
  return {
    id,
    projectId: 'proj-1',
    milestoneId: 'mile-1',
    amount: 150000,
    currency: 'INR',
    status: 'pending',
    createdAt: new Date().toISOString(),
    project: { title: 'Landing page redesign' },
    milestone: { name: 'Initial design sprint' },
  };
}

test.describe('Payment checkout (mocked Razorpay)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock session restoration for the dashboard guard.
    await page.route(/\/api\/auth\/refresh$/, async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
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

    // Mock profile fetch used by the guard after refresh.
    await page.route(/\/(?:api\/v1\/)?users\/profile$/, async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({ status: 200, json: userProfile });
    });

    // Some runtime environments/proxies may route payments endpoints without the `/api/v1` prefix.
    await page.route(/\/payments\//, async (route) => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      const url = new URL(route.request().url());
      const pathname = url.pathname.replace(/^\/api\/v1/, '');

      if (!pathname.includes('/payments/')) return route.continue();

      if (route.request().method() === 'GET' && pathname.endsWith('/payments/pay-1')) {
        await route.fulfill({
          status: 200,
          json: { status: 'success', data: makePaymentDetail('pay-1') },
        });
        return;
      }

      if (route.request().method() === 'POST' && pathname.endsWith('/payments/create-intent')) {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        const amount = typeof body?.amount === 'number' ? body.amount : 150000;
        const currency = typeof body?.currency === 'string' ? body.currency : 'INR';

        await route.fulfill({
          status: 200,
          json: {
            status: 'success',
            data: {
              id: 'order_ABC123',
              clientSecret: 'order_ABC123',
              amount,
              currency,
            },
          },
        });
        return;
      }

      if (route.request().method() === 'POST' && pathname.endsWith('/payments/confirm')) {
        const body = (await route.request().postDataJSON()) as {
          paymentIntentId: string;
          externalPaymentId: string;
          signature: string;
        };

        await route.fulfill({
          status: 200,
          json: {
            status: 'success',
            data: {
              paymentIntentId: body.paymentIntentId,
              externalPaymentId: body.externalPaymentId,
              status: 'succeeded',
            },
          },
        });
        return;
      }

      await route.continue();
    });

    // Fake gateway session + profile so the dashboard shell renders.
    await page.route(/\/api\/v1\//, async (route) => {
      const url = new URL(route.request().url());

      // Re-use common helpers for header/dashboard chrome.
      const handled = await fulfillCommonWebRoutes(route, {
        onProjects: async () => {
          await route.fulfill({
            status: 200,
            json: { status: 'success', data: [] },
          });
        },
      });
      if (handled) return;

      if (url.pathname.includes('/users/profile')) {
        await route.fulfill({ status: 200, json: userProfile });
        return;
      }

      if (route.request().method() === 'GET' && url.pathname.includes('/payments/pay-1')) {
        await route.fulfill({
          status: 200,
          json: { status: 'success', data: makePaymentDetail('pay-1') },
        });
        return;
      }

      if (url.pathname.includes('/payments/create-intent')) {
        // Create payment intent for Razorpay.
        const body = route.request().postDataJSON() as Record<string, unknown>;
        const amount = typeof body?.amount === 'number' ? body.amount : 150000;
        const currency = typeof body?.currency === 'string' ? body.currency : 'INR';
        await route.fulfill({
          status: 200,
          json: {
            status: 'success',
            data: {
              id: 'order_ABC123',
              clientSecret: 'order_ABC123',
              amount,
              currency,
            },
          },
        });
        return;
      }

      if (url.pathname.includes('/payments/confirm')) {
        // Confirm after successful Razorpay checkout.
        const body = (await route.request().postDataJSON()) as {
          paymentIntentId: string;
          externalPaymentId: string;
          signature: string;
        };
        await route.fulfill({
          status: 200,
          json: {
            status: 'success',
            data: {
              paymentIntentId: body.paymentIntentId,
              externalPaymentId: body.externalPaymentId,
              status: 'succeeded',
            },
          },
        });
        return;
      }

      await route.continue();
    });

    // Provide a fake Razorpay implementation on the window before the page code loads.
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Razorpay = function Razorpay(options: any) {
        this.__options = options;
        this.__handlers = new Map<string, () => void>();
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Razorpay.prototype.on = function on(event: string, handler: () => void) {
        this.__handlers.set(event, handler);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Razorpay.prototype.open = function open() {
        const opts = this.__options;
        // Simulate a successful checkout by immediately invoking the success handler.
        if (opts && typeof opts.handler === 'function') {
          void opts.handler({
            razorpay_order_id: 'order_ABC123',
            razorpay_payment_id: 'pay_external_123',
            razorpay_signature: 'test-signature',
          });
        }
      };
    });
  });

  test('completes a happy-path Razorpay checkout', async ({ page }) => {
    await page.goto('/payments/pay-1', { waitUntil: 'networkidle' });

    await expect(page.getByRole('button', { name: /Proceed to secure checkout/i })).toBeVisible({
      timeout: 15_000,
    });

    // Trigger the checkout button; the mocked Razorpay instance will drive success.
    const payButton = page.getByRole('button', { name: /Proceed to secure checkout/i });
    await expect(payButton).toBeEnabled();
    await payButton.click();

    // After the mock flow runs, we expect a success toast on the page.
    await expect(page.getByText('Payment completed successfully')).toBeVisible({ timeout: 15_000 });
  });
});
