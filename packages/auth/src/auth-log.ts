import { resolveCorrelationId } from '@nestlancer/config/correlation-id.mjs';
import { createLogger, resolveServiceName } from '@nestlancer/config/logger.mjs';

export type AuthLogOutcome =
  | 'ok'
  | '2fa'
  | 'rejected'
  | 'no_session'
  | 'upstream_error'
  | 'portal_mismatch'
  | 'invalid_body'
  | 'redirect';

/**
 * Domain auth event for container logs — never pass tokens or passwords.
 */
export function logAuthEvent(options: {
  event: string;
  request: Request;
  outcome: AuthLogOutcome | string;
  portal?: 'client' | 'admin';
  upstreamStatus?: number;
  serviceFallback?: string;
  code?: string;
}): void {
  const {
    event,
    request,
    outcome,
    portal,
    upstreamStatus,
    serviceFallback = 'nl-frontend',
    code,
  } = options;
  const correlationId = resolveCorrelationId({
    headers: request.headers,
    cookieHeader: request.headers.get('cookie') ?? undefined,
  });
  const service = resolveServiceName(serviceFallback);
  const log = createLogger({ service, correlationId });
  const level =
    outcome === 'upstream_error'
      ? 'error'
      : outcome === 'rejected' || outcome === 'portal_mismatch'
        ? 'warn'
        : 'info';
  const message = `${event} ${outcome}`;
  const fields: Record<string, unknown> = {
    event,
    outcome,
  };
  if (portal) fields.portal = portal;
  if (typeof upstreamStatus === 'number') fields.upstreamStatus = upstreamStatus;
  if (code) fields.code = code;

  if (level === 'error') log.error(message, fields);
  else if (level === 'warn') log.warn(message, fields);
  else log.info(message, fields);
}
