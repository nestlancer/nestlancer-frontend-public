'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'nestlancer-cookie-consent';
const COOKIE_NAME = 'nl_cookie_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type ConsentState = 'accepted' | 'dismissed';

export interface CookieConsentBannerProps {
  privacyHref?: string;
  /** e.g. `.nestlancer.com` so landing + app share consent. */
  cookieDomain?: string;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function expireCookie(name: string, domain?: string) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const parts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  document.cookie = parts.join('; ');
}

function writeConsentCookie(state: ConsentState, domain?: string) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(state)}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  expireCookie(COOKIE_NAME);
  if (domain) parts.push(`Domain=${domain}`);
  document.cookie = parts.join('; ');
}

function resolveStoredConsent(): ConsentState | null {
  try {
    const fromStorage = window.localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    if (fromStorage === 'accepted' || fromStorage === 'dismissed') return fromStorage;
  } catch {
    // ignore
  }
  const fromCookie = readCookie(COOKIE_NAME);
  if (fromCookie === 'accepted' || fromCookie === 'dismissed') return fromCookie;
  return null;
}

export function CookieConsentBanner({
  privacyHref = '/privacy',
  cookieDomain,
}: CookieConsentBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = resolveStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  function persist(state: ConsentState) {
    try {
      window.localStorage.setItem(STORAGE_KEY, state);
    } catch {
      // Ignore storage failures; banner still dismisses for this session.
    }
    writeConsentCookie(state, cookieDomain);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="relative z-[100] border-b border-border/80 bg-background p-3 sm:p-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies to keep you signed in and remember your preferences. See our{' '}
          <a
            href={privacyHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Privacy Policy
          </a>{' '}
          for details.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => persist('dismissed')}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => persist('accepted')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
