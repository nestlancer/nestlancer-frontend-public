import {
  extractAttachmentIds,
  formatSessionClient,
  progressEntryTypeLabel,
} from '@nestlancer/utils';

/** Defensive parsing of project / settings API payloads (shapes vary slightly by service version). */

export function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

export type TimelineEventRow = {
  id: string;
  title: string;
  description?: string;
  type?: string;
  entryType?: string;
  entryTypeLabel?: string;
  milestoneName?: string;
  attachmentIds?: string[];
  when: string;
  timestamp?: string;
};

export function extractTimelineEvents(data: unknown): TimelineEventRow[] {
  const r = asRecord(data);
  if (!r) return [];
  const raw = Array.isArray(r.events) ? r.events : Array.isArray(r.items) ? r.items : [];
  return (raw as unknown[]).map((item, i) => {
    const o = asRecord(item) ?? {};
    const metadata = asRecord(o.metadata);
    const ts = o.timestamp ?? o.createdAt ?? o.at ?? o.date;
    let when = '—';
    let timestamp: string | undefined;
    if (ts) {
      const d = new Date(String(ts));
      if (!Number.isNaN(d.getTime())) {
        timestamp = d.toISOString();
        when = d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      } else {
        when = String(ts);
      }
    }
    const entryTypeRaw =
      metadata?.entryType != null
        ? String(metadata.entryType)
        : o.type != null && o.type !== 'projectCreated'
          ? String(o.type)
          : undefined;
    const milestoneFromMeta = metadata?.milestone;
    const milestoneRecord = asRecord(milestoneFromMeta);
    const milestoneName =
      o.milestoneName != null
        ? String(o.milestoneName)
        : milestoneRecord?.name != null
          ? String(milestoneRecord.name)
          : undefined;

    const title = String(o.title ?? o.type ?? 'Event');
    const rawDescription =
      o.description != null
        ? String(o.description)
        : o.body != null
          ? String(o.body)
          : o.content != null
            ? String(o.content)
            : undefined;
    // NL-UI-005: hide body when API duplicated the title into description.
    // NL-UI-013: collapse "reason\n\n• reason" echo from older change requests.
    let description =
      rawDescription && rawDescription.trim() && rawDescription.trim() !== title.trim()
        ? rawDescription
        : undefined;
    if (description) {
      const lines = description
        .split(/\n+/)
        .map((l) => l.replace(/^•\s*/, '').trim())
        .filter(Boolean);
      if (lines.length >= 2 && lines.every((l) => l === lines[0])) {
        description = lines[0];
      }
    }

    return {
      id: String(o.id ?? `ev-${i}`),
      title,
      description,
      type: o.type != null ? String(o.type) : undefined,
      entryType: entryTypeRaw,
      entryTypeLabel: entryTypeRaw ? progressEntryTypeLabel(entryTypeRaw) : undefined,
      milestoneName,
      attachmentIds: extractAttachmentIds(o.details),
      when,
      timestamp,
    };
  });
}

export type MilestoneRow = {
  id: string;
  title: string;
  status?: string;
  due?: string;
  amount?: number;
  currency?: string;
  percentage?: number | null;
  order: number;
};

export function extractMilestoneRows(data: unknown): MilestoneRow[] {
  if (Array.isArray(data)) {
    return mapMilestoneItems(data);
  }
  const r = asRecord(data);
  if (!r) return [];
  const raw = Array.isArray(r.milestones)
    ? r.milestones
    : Array.isArray(r.items)
      ? r.items
      : Array.isArray(r.data)
        ? r.data
        : [];
  return mapMilestoneItems(raw as unknown[]);
}

function formatDueDate(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  // Prefer calendar date (YYYY-MM-DD) to avoid UTC→local year skew (NL-UI-007).
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  const ymd = dateOnly?.[1];
  if (ymd) {
    const parts = ymd.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return s;
}

function mapMilestoneItems(raw: unknown[]): MilestoneRow[] {
  const rows = raw.map((item, i) => {
    const o = asRecord(item) ?? {};
    // endDate is used by the progress service; dueDate/deadline/dueAt by other services
    const dueRaw = o.dueDate ?? o.endDate ?? o.deadline ?? o.dueAt;
    const amountRaw = o.amount ?? o.totalAmount;
    const percentageRaw = o.percentage;
    return {
      id: String(o.id ?? `ms-${i}`),
      title: String(o.title ?? o.name ?? `Milestone ${i + 1}`),
      status: o.status != null ? String(o.status) : undefined,
      due: formatDueDate(dueRaw),
      amount: typeof amountRaw === 'number' ? amountRaw : undefined,
      currency: o.currency != null ? String(o.currency) : undefined,
      percentage:
        typeof percentageRaw === 'number'
          ? percentageRaw
          : percentageRaw == null
            ? undefined
            : Number(percentageRaw),
      order: typeof o.order === 'number' ? o.order : i,
    };
  });
  return rows.sort((a, b) => a.order - b.order);
}

export type ProgressUpdateRow = { title: string; when: string; detail?: string };

export function extractProgressView(data: unknown): {
  percent: number | null;
  milestones: MilestoneRow[];
  updates: ProgressUpdateRow[];
} {
  const r = asRecord(data);
  if (!r) {
    return { percent: null, milestones: [], updates: [] };
  }
  const pctRaw = r.overallProgress ?? r.progress ?? r.completionPercent;
  const percent =
    typeof pctRaw === 'number' && Number.isFinite(pctRaw)
      ? Math.min(100, Math.max(0, pctRaw))
      : typeof pctRaw === 'string' && pctRaw.trim() !== '' && !Number.isNaN(Number(pctRaw))
        ? Math.min(100, Math.max(0, Number(pctRaw)))
        : null;

  const ms = Array.isArray(r.milestones)
    ? extractMilestoneRows({ milestones: r.milestones as unknown[] })
    : [];

  const rawUpdates = Array.isArray(r.recentUpdates) ? r.recentUpdates : [];
  const updates: ProgressUpdateRow[] = (rawUpdates as unknown[]).map((item) => {
    const o = asRecord(item) ?? {};
    const ts = o.createdAt ?? o.timestamp ?? o.at;
    let when = '—';
    if (ts) {
      const d = new Date(String(ts));
      when = Number.isNaN(d.getTime())
        ? String(ts)
        : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    }
    return {
      title: String(o.title ?? o.type ?? 'Update'),
      when,
      detail:
        o.description != null
          ? String(o.description)
          : o.content != null
            ? String(o.content)
            : undefined,
    };
  });

  return { percent, milestones: ms.length > 0 ? ms : extractMilestoneRows(data), updates };
}

export type SessionRow = {
  id: string;
  browser: string;
  os: string;
  deviceType: string;
  /** One-line label for lists (e.g. "Chrome on Linux" or IP fallback). */
  summary: string;
  ip: string | null;
  userAgentFull: string | null;
  current: boolean;
  lastActivity: string;
};

const GENERIC_BROWSER = new Set(['browser', 'unknown browser', 'unknown device']);
const GENERIC_OS = new Set(['device', 'unknown os', 'unknown', 'unknown platform']);

function isGenericDeviceLabel(value: string): boolean {
  const v = value.trim().toLowerCase();
  return !v || GENERIC_BROWSER.has(v) || GENERIC_OS.has(v);
}

export function extractSessionRows(data: unknown): SessionRow[] {
  if (Array.isArray(data)) {
    return (data as unknown[]).map((item, i) => mapSession(item, i));
  }
  const r = asRecord(data);
  if (r && Array.isArray(r.data))
    return (r.data as unknown[]).map((item, i) => mapSession(item, i));
  if (r && Array.isArray(r.items))
    return (r.items as unknown[]).map((item, i) => mapSession(item, i));
  if (r && Array.isArray(r.sessions))
    return (r.sessions as unknown[]).map((item, i) => mapSession(item, i));
  return [];
}

function mapSession(item: unknown, i: number): SessionRow {
  const o = asRecord(item) ?? {};
  const dev = asRecord(o.device) ?? {};
  const loc = asRecord(o.location) ?? {};
  const userAgent = typeof o.userAgent === 'string' ? o.userAgent : null;
  const ip = typeof loc.ip === 'string' ? loc.ip : typeof o.ip === 'string' ? o.ip : null;

  const parsed = formatSessionClient(ip, userAgent);

  let browserRaw = String(dev.browser ?? '').trim();
  let osRaw = String(dev.os ?? '').trim();
  if (isGenericDeviceLabel(browserRaw) || isGenericDeviceLabel(osRaw)) {
    if (parsed.device) {
      const [browserPart, osPart] = parsed.device.split(' on ');
      if (browserPart) browserRaw = browserPart;
      if (osPart) osRaw = osPart;
    }
  }
  const browser =
    !browserRaw || isGenericDeviceLabel(browserRaw)
      ? (parsed.device?.split(' on ')[0] ?? 'Web browser')
      : browserRaw;
  const os =
    !osRaw || isGenericDeviceLabel(osRaw)
      ? (parsed.device?.split(' on ')[1] ?? 'Unknown OS')
      : osRaw;
  const deviceType = String(dev.type ?? 'desktop');
  const lastRaw = o.lastActivityAt ?? o.lastActiveAt ?? o.updatedAt;
  let lastActivity = '—';
  if (lastRaw) {
    const d = new Date(String(lastRaw));
    lastActivity = Number.isNaN(d.getTime())
      ? String(lastRaw)
      : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
  return {
    id: String(o.id ?? `sess-${i}`),
    browser,
    os,
    deviceType,
    summary: parsed.summary,
    ip: parsed.ip,
    userAgentFull: parsed.userAgentFull,
    current: Boolean(o.current),
    lastActivity,
  };
}

export type ChannelTriState = { email: boolean; push: boolean; inApp: boolean };

export type DeliveryChannelInfo = {
  id: string;
  name: string;
  status: string;
};

export function parseDeliveryChannels(raw: unknown): DeliveryChannelInfo[] {
  const extract = (item: unknown): DeliveryChannelInfo | null => {
    if (typeof item === 'string') {
      return { id: item, name: item, status: 'available' };
    }
    const o = asRecord(item);
    if (!o) return null;
    const id = String(o.id ?? o.key ?? o.name ?? '');
    if (!id) return null;
    return {
      id,
      name: String(o.name ?? id),
      status: String(o.status ?? 'available'),
    };
  };

  if (Array.isArray(raw)) {
    return raw.map(extract).filter((c): c is DeliveryChannelInfo => c != null);
  }
  const rec = asRecord(raw);
  if (!rec) return [];
  const arr = Array.isArray(rec.channels)
    ? rec.channels
    : Array.isArray(rec.items)
      ? rec.items
      : [];
  return (arr as unknown[]).map(extract).filter((c): c is DeliveryChannelInfo => c != null);
}

export function normalizeChannelPrefs(v: unknown): ChannelTriState {
  const o = asRecord(v) ?? {};
  return {
    email: Boolean(o.email),
    push: Boolean(o.push),
    inApp: Boolean(o.inApp),
  };
}
