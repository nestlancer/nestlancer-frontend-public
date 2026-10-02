'use client';

import type { AnalyticsEventName } from '@nestlancer/constants';

type EventPayload = Record<string, unknown>;

function canUseBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Lightweight client-side telemetry sink.
 * Integrators can replace this with Segment/PostHog/Sentry breadcrumbs later.
 */
export function trackEvent(name: AnalyticsEventName, payload: EventPayload = {}): void {
  if (!canUseBrowser()) return;
  // Keep default behavior non-invasive while enabling debugging/verification.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[telemetry:web]', name, payload);
  }
  window.dispatchEvent(new CustomEvent('nestlancer:telemetry', { detail: { name, payload } }));
}
