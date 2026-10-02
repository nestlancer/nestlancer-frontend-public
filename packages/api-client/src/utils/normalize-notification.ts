import type { NotificationItem } from '@nestlancer/types';
import { safeHttpUrl, safeInAppPath } from '@nestlancer/utils';

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
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

function resolveNotificationHref(actionUrl?: string): string | undefined {
  if (!actionUrl) return undefined;
  const trimmed = actionUrl.trim();
  if (/^https?:/i.test(trimmed)) {
    const safe = safeHttpUrl(trimmed);
    if (!safe) return undefined;
    try {
      const url = new URL(safe);
      if (isTrustedStorageHost(url.hostname)) return safe;
      return safeInAppPath(`${url.pathname}${url.search}${url.hash}`) ?? undefined;
    } catch {
      return undefined;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return safeInAppPath(path) ?? undefined;
}

/** Map API / gateway notification rows to the shared NotificationItem shape. */
export function normalizeNotificationItem(raw: unknown): NotificationItem {
  const r = asRecord(raw) ?? {};
  const message = String(r.message ?? r.body ?? '');
  const readAt = r.readAt != null && r.readAt !== '' ? String(r.readAt) : null;
  const read = typeof r.read === 'boolean' ? r.read : Boolean(readAt);
  const actionUrl = r.actionUrl != null && r.actionUrl !== '' ? String(r.actionUrl) : undefined;

  return {
    id: String(r.id ?? ''),
    type: r.type != null ? String(r.type) : undefined,
    title: String(r.title ?? ''),
    message,
    body: message,
    data: asRecord(r.data),
    actionUrl,
    href: resolveNotificationHref(actionUrl),
    readAt,
    dismissedAt: r.dismissedAt != null && r.dismissedAt !== '' ? String(r.dismissedAt) : null,
    createdAt: String(r.createdAt ?? ''),
    read,
    priority: r.priority != null ? String(r.priority) : undefined,
  };
}

export function normalizeNotificationList(raw: unknown): NotificationItem[] {
  if (Array.isArray(raw)) return raw.map(normalizeNotificationItem);
  const r = asRecord(raw);
  if (!r) return [];
  if (Array.isArray(r.data)) return r.data.map(normalizeNotificationItem);
  if (Array.isArray(r.items)) return r.items.map(normalizeNotificationItem);
  return [];
}
