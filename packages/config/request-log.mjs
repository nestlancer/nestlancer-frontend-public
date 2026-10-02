import {
  CORRELATION_COOKIE,
  resolveCorrelationId,
} from './correlation-id.mjs';
import { createLogger, resolveServiceName } from './logger.mjs';

/**
 * Paths whose final status is owned by a Route Handler (`withRouteLog`) or the
 * API gateway (Next rewrite). Middleware must not emit a fake `http.request`
 * with status 200 / ~0ms for those — that conflicts with the real outcome.
 */
function isDelegatedAccessPath(path) {
  return (
    typeof path === 'string' &&
    (path === '/api/auth' ||
      path.startsWith('/api/auth/') ||
      path === '/api/v1' ||
      path.startsWith('/api/v1/'))
  );
}

/**
 * Stamp a page request with a stable correlation id and write one JSON access
 * line (aligned with backend http.request: status + durationMs).
 *
 * @param {{ setCorrelationCookie?: boolean }} [options]
 *   setCorrelationCookie defaults true. Marketing HTML should pass false so
 *   CDNs can cache pages (Set-Cookie forces DYNAMIC / no-store).
 */
export function withRequestLog(response, request, service, options = {}) {
  const start = Date.now();
  const correlationId = resolveCorrelationId({
    headers: request.headers,
    cookieHeader: request.headers.get('cookie'),
  });

  response.headers.set('X-Correlation-ID', correlationId);
  response.headers.set('X-Request-ID', correlationId);

  const setCookie = options.setCorrelationCookie !== false;
  // Readable by Axios / fetch so page → API hops share the same id.
  if (setCookie) {
    try {
      response.cookies.set(CORRELATION_COOKIE, correlationId, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        maxAge: 60 * 30,
      });
    } catch {
      /* some runtimes may not expose cookies on the response object */
    }
  }

  const path = request.nextUrl?.pathname || '';

  // Auth BFF + proxied gateway routes: correlation only — no premature status line.
  if (isDelegatedAccessPath(path)) {
    return response;
  }

  const status = response.status || 200;
  const durationMs = Date.now() - start;
  const resolvedService = resolveServiceName(service);
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  const log = createLogger({ service: resolvedService, correlationId });
  const message = `${request.method} ${path} ${status} ${durationMs}ms`;
  const fields = {
    event: 'http.request',
    method: request.method,
    path,
    status,
    durationMs,
  };

  if (level === 'error') log.error(message, fields);
  else if (level === 'warn') log.warn(message, fields);
  else log.info(message, fields);

  return response;
}
