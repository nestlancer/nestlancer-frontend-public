'use client';

import type { AnalyticsEventName } from '@nestlancer/constants';

type EventPayload = Record<string, unknown>;

export function trackEvent(name: AnalyticsEventName, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[telemetry:admin]', name, payload);
  }
  window.dispatchEvent(new CustomEvent('nestlancer:telemetry', { detail: { name, payload } }));
}
