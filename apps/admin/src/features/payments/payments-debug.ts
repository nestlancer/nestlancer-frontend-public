const PREFIX = '[Admin/Payments]';

/** Console tracing for local development only. */
function isPaymentsDebugEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function adminPaymentsDebug(event: string, data?: Record<string, unknown>): void {
  if (!isPaymentsDebugEnabled()) return;
  if (data !== undefined) {
    console.log(`${PREFIX} ${event}`, data);
  } else {
    console.log(`${PREFIX} ${event}`);
  }
}

export function adminPaymentsDebugWarn(event: string, data?: Record<string, unknown>): void {
  if (!isPaymentsDebugEnabled()) return;
  if (data !== undefined) {
    console.warn(`${PREFIX} ${event}`, data);
  } else {
    console.warn(`${PREFIX} ${event}`);
  }
}

export function adminPaymentsDebugError(
  event: string,
  error: unknown,
  data?: Record<string, unknown>
): void {
  if (!isPaymentsDebugEnabled()) return;
  console.error(`${PREFIX} ${event}`, { ...data, error });
}
