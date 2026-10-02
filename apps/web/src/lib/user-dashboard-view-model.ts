import type { NotificationItem } from '@nestlancer/types';

export type DashboardActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  href?: string;
};

function relTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function notificationsToActivity(items: NotificationItem[]): DashboardActivityItem[] {
  return items.map((n) => {
    const rawTitle = String(n.title ?? '').trim();
    // Clean titles like "New message on ." when project name was missing at send time.
    const title = rawTitle.replace(/\s+on\s*\.?\s*$/i, '').trim() || 'Notification';
    return {
      id: `n-${n.id}`,
      title,
      detail: n.message || n.body,
      time: relTime(n.createdAt),
      href: n.href,
    };
  });
}

export function activityLogToRows(raw: unknown): DashboardActivityItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const rec = raw as Record<string, unknown>;
  const items = Array.isArray(rec.items) ? rec.items : Array.isArray(rec.data) ? rec.data : [];
  return (items as unknown[]).map((row, i) => {
    const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const title = String(r.action ?? r.type ?? r.title ?? 'Activity');
    const detail = String(r.description ?? r.detail ?? r.message ?? '');
    const ts = String(r.timestamp ?? r.createdAt ?? r.at ?? '');
    return {
      id: String(r.id ?? `a-${i}`),
      title,
      detail,
      time: ts ? relTime(ts) : '',
    };
  });
}

export function mergeActivity(
  a: DashboardActivityItem[],
  b: DashboardActivityItem[],
  limit: number
): DashboardActivityItem[] {
  const seen = new Set<string>();
  const out: DashboardActivityItem[] = [];
  for (const row of [...a, ...b]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}
