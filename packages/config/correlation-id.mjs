/**
 * Shared correlation id helpers for middleware, Axios, BFF, and raw fetch.
 * Cookie name is readable by the browser so API clients can reuse the page id.
 */
export const CORRELATION_COOKIE = 'nl_correlation_id';

/** Client ids must be short trace tokens, not log-flood / header-injection payloads. */
export const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isUsableCorrelationId(value) {
  return typeof value === 'string' && CORRELATION_ID_PATTERN.test(value);
}

export function mintCorrelationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readCookie(name, cookieHeader) {
  const raw =
    cookieHeader ||
    (typeof document !== 'undefined' ? document.cookie : '') ||
    '';
  const parts = String(raw).split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

/**
 * Resolve an existing id from headers / cookie / sessionStorage, else mint.
 * Pass `headers` (Headers | Record) when available (middleware, BFF, Axios).
 * @returns {string}
 */
export function resolveCorrelationId(options = {}) {
  const { headers, cookieHeader, prefer } = options;
  const preferred = typeof prefer === 'string' ? prefer.trim() : '';
  if (isUsableCorrelationId(preferred)) return preferred;

  const fromHeaders = readHeader(headers, 'x-correlation-id') || readHeader(headers, 'x-request-id');
  if (fromHeaders) return fromHeaders;

  const fromCookie = readCookie(CORRELATION_COOKIE, cookieHeader);
  if (fromCookie && isUsableCorrelationId(fromCookie)) return fromCookie;

  if (typeof sessionStorage !== 'undefined') {
    try {
      const existing = sessionStorage.getItem(CORRELATION_COOKIE);
      if (existing && isUsableCorrelationId(existing)) return existing;
    } catch {
      /* private mode */
    }
  }

  const minted = mintCorrelationId();
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(CORRELATION_COOKIE, minted);
    } catch {
      /* ignore */
    }
  }
  return minted;
}

function readHeader(headers, name) {
  if (!headers) return undefined;
  let raw;
  if (typeof headers.get === 'function') {
    raw = headers.get(name) || headers.get(name.toLowerCase()) || undefined;
  } else {
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== lower) continue;
      if (Array.isArray(value)) {
        raw = value[0];
        break;
      }
      if (typeof value === 'string' && value) {
        raw = value;
        break;
      }
    }
  }
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  // Proxies may comma-join client + server ids; echo the first token only.
  const first = raw.split(',')[0].trim();
  return isUsableCorrelationId(first) ? first : undefined;
}

/** Apply both Nestlancer correlation headers onto a Headers / plain object / AxiosHeaders. */
export function applyCorrelationHeaders(headers, correlationId) {
  const id = isUsableCorrelationId(correlationId)
    ? correlationId
    : resolveCorrelationId({ headers });
  if (!headers) {
    return {
      'X-Request-ID': id,
      'X-Correlation-ID': id,
    };
  }
  if (typeof headers.set === 'function') {
    if (!headers.has('X-Request-ID') && !headers.has('x-request-id')) {
      headers.set('X-Request-ID', id);
    }
    if (!headers.has('X-Correlation-ID') && !headers.has('x-correlation-id')) {
      headers.set('X-Correlation-ID', id);
    }
    return headers;
  }
  const plain = headers;
  if (!plain['X-Request-ID'] && !plain['x-request-id']) plain['X-Request-ID'] = id;
  if (!plain['X-Correlation-ID'] && !plain['x-correlation-id']) plain['X-Correlation-ID'] = id;
  return plain;
}
