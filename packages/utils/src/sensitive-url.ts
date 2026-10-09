/**
 * One-shot values that must leave the browser URL without lingering in
 * sessionStorage (XSS can read sessionStorage — NL-BV-C1-08).
 * In-memory only for the current JS realm; a full reload requires the email link again.
 */
export const SENSITIVE_SESSION_KEYS = {
  resetPasswordToken: 'nl.auth.resetToken',
  verifyEmailToken: 'nl.auth.verifyToken',
  postRegisterEmail: 'nl.auth.postRegisterEmail',
} as const;

const memoryStore = new Map<string, string>();

function clearLegacySessionStorage(storageKey: string): void {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return;
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

/** Persist a value for the current tab JS realm and remove it from the address bar. */
export function stashSensitiveQueryParam(
  paramName: string,
  storageKey: string,
  pathname: string,
  searchParams: URLSearchParams,
  replaceUrl: (nextPath: string) => void
): string | null {
  clearLegacySessionStorage(storageKey);

  const value = searchParams.get(paramName);
  if (!value) {
    return memoryStore.get(storageKey) ?? null;
  }

  memoryStore.set(storageKey, value);

  const params = new URLSearchParams(searchParams.toString());
  params.delete(paramName);
  const qs = params.toString();
  replaceUrl(qs ? `${pathname}?${qs}` : pathname);

  return value;
}

export function readOneShotSessionValue(storageKey: string): string | null {
  clearLegacySessionStorage(storageKey);
  return memoryStore.get(storageKey) ?? null;
}

export function clearOneShotSessionValue(storageKey: string): void {
  memoryStore.delete(storageKey);
  clearLegacySessionStorage(storageKey);
}

export function writeOneShotSessionValue(storageKey: string, value: string): void {
  clearLegacySessionStorage(storageKey);
  memoryStore.set(storageKey, value);
}
