import { peelSuccessEnvelope } from '@nestlancer/api-client';

/** Best-effort extraction of list rows from heterogeneous admin payloads. */
export function pickAdminRows(payload: unknown): Record<string, unknown>[] {
  payload = peelSuccessEnvelope(payload);
  if (Array.isArray(payload)) {
    return payload.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
  }
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    for (const key of [
      'data',
      'items',
      'users',
      'results',
      'records',
      'rows',
      'messages',
      'deliverables',
      'posts',
      'comments',
      'templates',
      'disputes',
      'flagged',
      'flaggedMessages',
      'payments',
      'mismatches',
      'discrepancies',
      'notifications',
      'transactions',
    ]) {
      const v = o[key];
      if (Array.isArray(v)) {
        return v.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
      }
    }
  }
  return [];
}

export function pickAdminRecord(payload: unknown): Record<string, unknown> | null {
  const unwrapped = peelSuccessEnvelope(payload);
  if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)) {
    const o = unwrapped as Record<string, unknown>;
    const nested = o.data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
    return o;
  }
  return null;
}

export function rowId(row: Record<string, unknown>): string {
  const id = row.id ?? row.milestoneId ?? row.userId ?? row._id;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
}

export type AdminPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Extract pagination metadata from list/search API payloads. */
function readPaginationBlock(block: unknown): AdminPagination | null {
  if (!block || typeof block !== 'object') return null;
  const pg = block as Record<string, unknown>;
  const page = typeof pg.page === 'number' ? pg.page : null;
  const limit =
    typeof pg.limit === 'number' ? pg.limit : typeof pg.pageSize === 'number' ? pg.pageSize : null;
  const total =
    typeof pg.total === 'number'
      ? pg.total
      : typeof pg.totalItems === 'number'
        ? pg.totalItems
        : null;
  const totalPages = typeof pg.totalPages === 'number' ? pg.totalPages : null;
  if (page == null || limit == null || total == null || totalPages == null) return null;
  return { page, limit, total, totalPages };
}

/** Extract pagination metadata from list/search API payloads. */
export function pickAdminPagination(payload: unknown): AdminPagination | null {
  payload = peelSuccessEnvelope(payload);
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    return (
      readPaginationBlock(o.pagination) ?? readPaginationBlock(o.meta) ?? readPaginationBlock(o)
    );
  }
  return null;
}

export function rowTitle(row: Record<string, unknown>): string {
  const title = row.title ?? row.name;
  if (typeof title === 'string' && title.length > 0) return title;
  const email = row.email;
  if (typeof email === 'string' && email.length > 0) return email;
  const name = [row.firstName, row.lastName].filter((x) => typeof x === 'string').join(' ');
  if (name.length > 0) return name;
  const id = rowId(row);
  return id || '—';
}

/** Client email from a project row (`client` relation or legacy `user`). */
export function clientEmailFromRow(row: Record<string, unknown>): string {
  for (const key of ['client', 'user']) {
    const rel = row[key];
    if (rel && typeof rel === 'object') {
      const email = (rel as Record<string, unknown>).email;
      if (typeof email === 'string' && email.length > 0) return email;
    }
  }
  const legacy = row.clientEmail;
  if (typeof legacy === 'string' && legacy.length > 0) return legacy;
  return '—';
}

/** Normalize API status for display (camelCase or SCREAMING_SNAKE). */
export function formatAdminStatus(status: unknown): string {
  const s = String(status ?? '—');
  if (!s || s === '—') return '—';
  // SCREAMING_SNAKE / ALLCAPS: do not insert spaces before every capital
  // (that produced "I N P R O G R E S S" — NL-UI-004).
  if (/^[A-Z0-9_]+$/.test(s)) {
    return s
      .split('_')
      .filter(Boolean)
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function projectStatusTone(
  status: unknown
): 'success' | 'neutral' | 'warning' | 'error' | 'info' | 'purple' {
  const s = String(status ?? '').toLowerCase();
  if (s.includes('complet')) return 'success';
  if (s.includes('archiv') || s.includes('cancel')) return 'neutral';
  if (s.includes('reject') || s.includes('fail')) return 'error';
  if (s.includes('progress') || s.includes('review') || s.includes('pending')) return 'warning';
  if (s.includes('active') || s.includes('created')) return 'success';
  return 'warning';
}
