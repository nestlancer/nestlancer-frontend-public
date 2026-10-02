export type SessionExpiredReason = 'refresh_failed' | 'unauthorized';

type SessionExpiredListener = (reason: SessionExpiredReason) => void;

const listeners = new Set<SessionExpiredListener>();

/** Subscribe to session expiry (e.g. failed token refresh). Used by apps to redirect to login. */
export function subscribeSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called when the API client cannot restore an access token (refresh failed or auth endpoint 401). */
export function notifySessionExpired(reason: SessionExpiredReason): void {
  listeners.forEach((fn) => {
    try {
      fn(reason);
    } catch {
      /* ignore listener errors */
    }
  });
}
