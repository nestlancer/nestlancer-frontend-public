/**
 * Baseline browser security headers for all responses (including redirects).
 * Kept in sync with apps/web|admin|landing next.config.mjs headers().
 */
export const BASE_SECURITY_HEADERS = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['X-XSS-Protection', '0'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'],
];

/** Attach baseline security headers without overwriting existing values. */
export function applySecurityHeaders(response) {
  if (!response?.headers?.set) return response;
  for (const [key, value] of BASE_SECURITY_HEADERS) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  }
  return response;
}
