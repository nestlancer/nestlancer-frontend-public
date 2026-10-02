/** Session keys for one-time values that must not remain in the browser URL. */
export const SENSITIVE_SESSION_KEYS = {
  resetPasswordToken: 'nl.auth.resetToken',
  verifyEmailToken: 'nl.auth.verifyToken',
  postRegisterEmail: 'nl.auth.postRegisterEmail',
} as const;

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

/** Persist a value for the current tab session and remove it from the address bar. */
export function stashSensitiveQueryParam(
  paramName: string,
  storageKey: string,
  pathname: string,
  searchParams: URLSearchParams,
  replaceUrl: (nextPath: string) => void
): string | null {
  const value = searchParams.get(paramName);
  if (!value) {
    if (canUseSessionStorage()) {
      const stored = window.sessionStorage.getItem(storageKey);
      return stored || null;
    }
    return null;
  }

  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(storageKey, value);
  }

  const params = new URLSearchParams(searchParams.toString());
  params.delete(paramName);
  const qs = params.toString();
  replaceUrl(qs ? `${pathname}?${qs}` : pathname);

  return value;
}

export function readOneShotSessionValue(storageKey: string): string | null {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(storageKey);
}

export function clearOneShotSessionValue(storageKey: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(storageKey);
}

export function writeOneShotSessionValue(storageKey: string, value: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(storageKey, value);
}
