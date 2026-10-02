import { routes } from './routes';

/** Auth/marketing paths — never used as post-login or `?from=` return targets. */
const AUTH_GUEST_ONLY_EXACT = new Set<string>([
  routes.home,
  routes.login,
  routes.register,
  routes.forgotPassword,
  routes.resetPassword,
  routes.verifyEmail,
]);

function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function normalizePathname(path: string): string {
  const base = path.split('?')[0]?.split('#')[0] ?? path;
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1);
  }
  return base || routes.home;
}

/**
 * Whether `path` is a safe post-login destination (false for `/`, `/login`, etc.).
 * Rejects absolute URLs, protocol-relative hosts, and backslash tricks.
 */
export function isAuthGuestOnlyPath(path: string | null | undefined): boolean {
  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    hasControlChars(path)
  ) {
    return true;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    return true;
  }
  // Block encoded separators and nested scheme smuggling: /%2f…, /http:…
  const decoded = (() => {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  })();
  if (
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    hasControlChars(decoded) ||
    /^[a-z][a-z0-9+.-]*:/i.test(decoded)
  ) {
    return true;
  }
  return AUTH_GUEST_ONLY_EXACT.has(normalizePathname(path));
}

/**
 * Resolves the route to navigate to after a successful client sign-in.
 * Honors deep-link `from` only for same-origin relative paths; otherwise `/dashboard`.
 */
export function resolvePostLoginRedirect(from: string | null | undefined): string {
  if (isAuthGuestOnlyPath(from ?? null)) {
    return routes.dashboard;
  }
  const pathOnly = (from ?? '').split('?')[0]?.split('#')[0] ?? '';
  if (
    !pathOnly.startsWith('/') ||
    pathOnly.startsWith('//') ||
    pathOnly.includes('\\') ||
    hasControlChars(from ?? '')
  ) {
    return routes.dashboard;
  }
  return from ?? routes.dashboard;
}

/**
 * Builds `/login` with an optional `from` query for returning after sign-in.
 */
export function buildLoginHref(currentPath: string | null | undefined): string {
  if (
    currentPath &&
    currentPath !== routes.login &&
    currentPath.startsWith('/') &&
    !isAuthGuestOnlyPath(currentPath)
  ) {
    return `${routes.login}?from=${encodeURIComponent(currentPath)}`;
  }
  return routes.login;
}
