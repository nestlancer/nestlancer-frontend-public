import { safeHttpUrl, safeInAppPath } from './safe-url';

/** Preference categories aligned with backend resolvePreferenceCategory(). */
export const NOTIFICATION_PREFERENCE_CATEGORIES = [
  'quotes',
  'payments',
  'messages',
  'projects',
  'requests',
  'account',
] as const;

export type NotificationPreferenceCategory = (typeof NOTIFICATION_PREFERENCE_CATEGORIES)[number];

/** Map a notification `type` (e.g. `quote.ready`) onto preference categories. Unknown types stay uncategorized. */
export function notificationCategoryFromType(
  type?: string | null
): NotificationPreferenceCategory | null {
  if (!type) return null;
  const raw = type.trim().toLowerCase();
  const head = raw.split(/[._:-]/)[0] ?? raw;
  if (head === 'quote' || head === 'quotes') return 'quotes';
  if (head === 'payment' || head === 'payments' || head === 'invoice' || head === 'invoices') {
    return 'payments';
  }
  if (head === 'message' || head === 'messages' || head === 'chat') return 'messages';
  if (head === 'project' || head === 'projects') return 'projects';
  if (head === 'request' || head === 'requests') return 'requests';
  if (
    head === 'account' ||
    head === 'auth' ||
    head === 'security' ||
    head === 'user' ||
    head === 'system' ||
    head === 'export'
  ) {
    return 'account';
  }
  return null;
}

const LEGACY_PREFERENCE_ALIASES: Record<string, NotificationPreferenceCategory> = {
  project: 'projects',
  payment: 'payments',
  quote: 'quotes',
  request: 'requests',
};

export function normalizePreferenceCategory(key: string): string {
  return LEGACY_PREFERENCE_ALIASES[key] ?? key;
}

export function isNotificationUnread(item: { read?: boolean; readAt?: string | null }): boolean {
  if (typeof item.read === 'boolean') return !item.read;
  return !item.readAt;
}

function isTrustedStorageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'amazonaws.com' ||
    host.endsWith('.amazonaws.com') ||
    host === 's3.nestlancer.com' ||
    host === 'cdn.nestlancer.com' ||
    host.endsWith('.s3.nestlancer.com')
  );
}

function isTrustedDownloadUrl(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  return isTrustedStorageHost(url.hostname);
}

/** Resolve actionUrl to an in-app href or external download URL. */
export function resolveNotificationHref(actionUrl?: string | null): string | undefined {
  if (!actionUrl) return undefined;
  const trimmed = actionUrl.trim();
  if (/^https?:/i.test(trimmed)) {
    const safe = safeHttpUrl(trimmed);
    if (!safe) return undefined;
    try {
      const url = new URL(safe);
      if (isTrustedDownloadUrl(url)) return safe;
      return safeInAppPath(`${url.pathname}${url.search}${url.hash}`) ?? undefined;
    } catch {
      return undefined;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return safeInAppPath(path) ?? undefined;
}

export function isDownloadNotificationType(type?: string): boolean {
  return type === 'export.ready' || type === 'document.ready';
}

export function isExternalNotificationHref(href?: string): boolean {
  return safeHttpUrl(href) != null;
}
