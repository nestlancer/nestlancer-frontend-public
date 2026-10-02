const PREFIX = '[Payments]';

/** Console tracing for local development only. */
function isPaymentsDebugEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function paymentsDebug(event: string, data?: Record<string, unknown>): void {
  if (!isPaymentsDebugEnabled()) return;
  if (data !== undefined) {
    console.log(`${PREFIX} ${event}`, data);
  } else {
    console.log(`${PREFIX} ${event}`);
  }
}

export function paymentsDebugWarn(event: string, data?: Record<string, unknown>): void {
  if (!isPaymentsDebugEnabled()) return;
  if (data !== undefined) {
    console.warn(`${PREFIX} ${event}`, data);
  } else {
    console.warn(`${PREFIX} ${event}`);
  }
}

export function paymentsDebugError(
  event: string,
  error: unknown,
  data?: Record<string, unknown>
): void {
  if (!isPaymentsDebugEnabled()) return;
  console.error(`${PREFIX} ${event}`, { ...data, error });
}
