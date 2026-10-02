import { resolveCorrelationId } from './correlation-id.mjs';
import { createLogger, resolveServiceName } from './logger.mjs';

/**
 * Wrap an App Router route handler so the final status + duration land in
 * container stdout (middleware alone cannot see handler outcomes).
 *
 * Does not log request/response bodies (tokens, passwords).
 *
 * @param {(request: Request, context?: unknown) => Promise<Response> | Response} handler
 * @param {{ service: string, event?: string }} options
 */
export function withRouteLog(handler, options) {
  const fallbackService = options?.service || 'nl-frontend';
  const event = options?.event || 'http.route';

  return async function loggedHandler(request, context) {
    const start = Date.now();
    const service = resolveServiceName(fallbackService);
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const correlationId = resolveCorrelationId({
      headers: request.headers,
      cookieHeader: request.headers.get('cookie') ?? undefined,
    });
    const log = createLogger({ service, correlationId });

    try {
      const response = await handler(request, context);
      const status = response?.status ?? 200;
      const durationMs = Date.now() - start;
      const message = `${method} ${path} ${status} ${durationMs}ms`;
      const fields = {
        event,
        method,
        path,
        status,
        durationMs,
      };

      if (status >= 500) log.error(message, fields);
      else if (status >= 400) log.warn(message, fields);
      else log.info(message, fields);

      try {
        if (response && typeof response.headers?.set === 'function') {
          if (!response.headers.has('X-Correlation-ID')) {
            response.headers.set('X-Correlation-ID', correlationId);
          }
          if (!response.headers.has('X-Request-ID')) {
            response.headers.set('X-Request-ID', correlationId);
          }
        }
      } catch {
        /* immutable response headers in some edge cases */
      }

      return response;
    } catch (err) {
      const durationMs = Date.now() - start;
      const errMessage = err instanceof Error ? err.message : String(err);
      log.error(`${method} ${path} failed ${durationMs}ms`, {
        event,
        method,
        path,
        status: 500,
        durationMs,
        error: errMessage,
      });
      throw err;
    }
  };
}
