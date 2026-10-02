import { unwrapGatewayBody } from './unwrap-gateway-body';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Normalize gateway / microservice payloads that use `{ status: 'success', ... }`
 * with or without a nested `data` field.
 */
export function peelSuccessEnvelope(raw: unknown): unknown {
  if (raw === '' || raw === null || raw === undefined) {
    return {};
  }
  let cur: unknown = unwrapGatewayBody(raw);
  if (isRecord(cur) && cur.status === 'success' && 'data' in cur && cur.data !== undefined) {
    cur = unwrapGatewayBody(cur.data);
  }
  if (isRecord(cur) && cur.status === 'success') {
    const rest = { ...cur };
    delete rest.status;
    return Object.keys(rest).length > 0 ? rest : {};
  }
  if (typeof cur === 'string' && cur.length === 0) {
    return {};
  }
  return cur;
}

export function asArray<T>(raw: unknown): T[] {
  const inner = peelSuccessEnvelope(raw);
  if (Array.isArray(inner)) return inner as T[];
  if (isRecord(inner)) {
    if (Array.isArray(inner.items)) return inner.items as T[];
    if (Array.isArray(inner.data)) return inner.data as T[];
    if (Array.isArray(inner.projects)) return inner.projects as T[];
    if (Array.isArray(inner.results)) return inner.results as T[];
  }
  return [];
}

export function asPaginated<T>(raw: unknown): {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} {
  const inner = peelSuccessEnvelope(raw);
  if (isRecord(inner) && Array.isArray(inner.data) && isRecord(inner.pagination)) {
    const pag = inner.pagination;
    const items = inner.data as T[];
    const total = typeof pag.totalItems === 'number' ? pag.totalItems : items.length;
    const page = typeof pag.page === 'number' ? pag.page : 1;
    const pageSize = typeof pag.limit === 'number' ? pag.limit : items.length || 20;
    const totalPages =
      typeof pag.totalPages === 'number'
        ? pag.totalPages
        : Math.max(1, Math.ceil(total / (pageSize || 1)));
    return {
      items,
      total,
      page,
      pageSize,
      hasMore: typeof pag.hasNextPage === 'boolean' ? pag.hasNextPage : page < totalPages,
    };
  }
  if (isRecord(inner) && Array.isArray(inner.items)) {
    if (typeof inner.total === 'number') {
      const page = typeof inner.page === 'number' ? inner.page : 1;
      const pageSize =
        typeof inner.pageSize === 'number' ? inner.pageSize : (inner.items as T[]).length || 20;
      return {
        items: inner.items as T[],
        total: inner.total,
        page,
        pageSize,
        hasMore: typeof inner.hasMore === 'boolean' ? inner.hasMore : page * pageSize < inner.total,
      };
    }
    const meta = isRecord(inner.meta) ? inner.meta : {};
    const total = typeof meta.total === 'number' ? meta.total : inner.items.length;
    const page = typeof meta.page === 'number' ? meta.page : 1;
    const limit =
      typeof meta.limit === 'number'
        ? meta.limit
        : typeof meta.pageSize === 'number'
          ? meta.pageSize
          : inner.items.length;
    const totalPages =
      typeof meta.totalPages === 'number'
        ? meta.totalPages
        : Math.max(1, Math.ceil(total / (limit || 1)));
    return {
      items: inner.items as T[],
      total,
      page,
      pageSize: limit,
      hasMore: page < totalPages,
    };
  }
  const arr = asArray<T>(inner);
  return {
    items: arr,
    total: arr.length,
    page: 1,
    pageSize: arr.length || 20,
    hasMore: false,
  };
}
