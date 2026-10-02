export const PROGRESS_ENTRY_TYPES = [
  { value: 'UPDATE', label: 'Daily update' },
  { value: 'INTERNAL_NOTE', label: 'Internal note' },
  { value: 'MILESTONE_COMPLETE', label: 'Milestone complete' },
  { value: 'DELIVERABLE_UPLOAD', label: 'Deliverable upload' },
  { value: 'STATUS_CHANGE', label: 'Status change' },
] as const;

export type ProgressEntryTypeValue = (typeof PROGRESS_ENTRY_TYPES)[number]['value'];

const ENTRY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROGRESS_ENTRY_TYPES.map((t) => [t.value, t.label])
);

export function progressEntryTypeLabel(type?: string | null): string {
  if (!type) return 'Update';
  return ENTRY_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').toLowerCase();
}

export function buildEodTemplateTitle(date = new Date()): string {
  const label = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Daily update — ${label}`;
}

export const EOD_DESCRIPTION_TEMPLATE = `**Done today**



**Blockers**



**Next**

`;

export function isInternalProgressType(type: string): boolean {
  return type === 'INTERNAL_NOTE';
}

export function visibilityForEntryType(type: string): 'CLIENT_VISIBLE' | 'INTERNAL' {
  return isInternalProgressType(type) ? 'INTERNAL' : 'CLIENT_VISIBLE';
}

export type ProgressDayGroup<T> = {
  dayKey: string;
  dayLabel: string;
  items: T[];
};

export function groupByDay<T extends { timestamp?: string | Date | null }>(
  items: T[],
  locale?: string
): ProgressDayGroup<T>[] {
  const map = new Map<string, ProgressDayGroup<T>>();

  for (const item of items) {
    const raw = item.timestamp;
    const date = raw ? new Date(raw) : new Date();
    const dayKey = Number.isNaN(date.getTime()) ? 'unknown' : date.toISOString().slice(0, 10);
    const dayLabel = Number.isNaN(date.getTime())
      ? 'Unknown date'
      : date.toLocaleDateString(locale, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

    const existing = map.get(dayKey);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(dayKey, { dayKey, dayLabel, items: [item] });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}

export function extractAttachmentIds(details: unknown): string[] {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return [];
  const ids = (details as Record<string, unknown>).attachmentIds;
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => String(id)).filter(Boolean);
}

export function hasProgressEntryToday(rows: unknown[], now = new Date()): boolean {
  const today = now.toDateString();
  return rows.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const createdAt = (row as Record<string, unknown>).createdAt;
    if (!createdAt) return false;
    const d = new Date(String(createdAt));
    return !Number.isNaN(d.getTime()) && d.toDateString() === today;
  });
}
