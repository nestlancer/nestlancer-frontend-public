/**
 * Cookie names aligned with the API gateway / auth service.
 *
 * HttpOnly refresh cookie is set only by Next.js `/api/auth/*` route handlers (BFF).
 * The access token is kept in memory only so Axios can attach `Authorization: Bearer`.
 * Session restore uses the HttpOnly refresh cookie via `/api/auth/refresh` (SessionBootstrap).
 * Refresh tokens never touch JavaScript storage.
 */
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
/** HttpOnly presence flag set alongside the refresh cookie. Not a credential. */
export const SESSION_HINT_COOKIE = 'nl_session';
/** HttpOnly hint: `1` = persistent refresh cookie, `0` = session cookie. */
export const REMEMBER_ME_COOKIE = 'nl_remember';
/**
 * HttpOnly client-portal access JWT used while an admin finishes a user's steps.
 * Not a refresh credential. Middleware treats it as a session so a reload stays signed in.
 */
export const IMPERSONATION_COOKIE = 'nl_impersonation';

let actingAsUser = false;

/** True while this tab is finishing a client account for support. Refresh must not replace it. */
export function setActingAsUser(active: boolean): void {
  actingAsUser = active;
}

export function isActingAsUser(): boolean {
  return actingAsUser;
}

export interface AuthTokens {
  accessToken: string;
  /** Omitted when refresh is stored in an HttpOnly cookie via the auth BFF. */
  refreshToken?: string;
  /** Seconds until the access token expires. */
  expiresIn?: number;
  tokenType?: string;
}

type TokenChangeListener = (tokens: AuthTokens | null) => void;

let memoryAccess: string | null = null;
let memoryExpiresAt: number | null = null;

const listeners = new Set<TokenChangeListener>();

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function emit(): void {
  const tokens = getTokens();
  listeners.forEach((fn) => {
    try {
      fn(tokens);
    } catch {
      /* ignore listener errors */
    }
  });
}

function clearLegacyTokenStorage(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem('nl.auth.access');
    window.sessionStorage.removeItem('nl.auth.expiresAt');
    window.localStorage.removeItem('nl.auth.access');
    window.localStorage.removeItem('nl.auth.refresh');
    window.localStorage.removeItem('nl.auth.expiresAt');
  } catch {
    /* ignore */
  }
}

export function setTokens(tokens: AuthTokens): void {
  memoryAccess = tokens.accessToken;
  const accessTtl = tokens.expiresIn && tokens.expiresIn > 0 ? tokens.expiresIn : 15 * 60;
  memoryExpiresAt = Date.now() + accessTtl * 1000;
  // Do not persist access JWTs in sessionStorage — XSS could steal them.
  clearLegacyTokenStorage();
  emit();
}

export function clearTokens(): void {
  memoryAccess = null;
  memoryExpiresAt = null;
  actingAsUser = false;
  clearLegacyTokenStorage();
  emit();
}

export function getAccessToken(): string | null {
  return memoryAccess;
}

/** Refresh tokens live in HttpOnly cookies — not readable from JavaScript. */
export function getRefreshToken(): string | null {
  return null;
}

export function getTokens(): AuthTokens | null {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  return { accessToken };
}

export function getAccessTokenExpiresAt(): number | null {
  return memoryExpiresAt;
}

export function hasTokens(): boolean {
  return Boolean(getAccessToken());
}

/** True when an access token is already in memory. The session hint cookie is HttpOnly. */
export function hasSessionHint(): boolean {
  return hasTokens();
}

export function subscribeToTokens(listener: TokenChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
