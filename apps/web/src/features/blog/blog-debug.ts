const PREFIX = '[Blog]';

/** Console tracing for local development only. */
function isBlogDebugEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function blogDebug(event: string, data?: Record<string, unknown>): void {
  if (!isBlogDebugEnabled()) return;
  if (data !== undefined) {
    console.log(`${PREFIX} ${event}`, data);
  } else {
    console.log(`${PREFIX} ${event}`);
  }
}

export function blogDebugWarn(event: string, data?: Record<string, unknown>): void {
  if (!isBlogDebugEnabled()) return;
  if (data !== undefined) {
    console.warn(`${PREFIX} ${event}`, data);
  } else {
    console.warn(`${PREFIX} ${event}`);
  }
}

export function blogDebugError(
  event: string,
  error: unknown,
  data?: Record<string, unknown>
): void {
  if (!isBlogDebugEnabled()) return;
  console.error(`${PREFIX} ${event}`, { ...data, error });
}
