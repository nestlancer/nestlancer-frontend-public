/**
 * Browser storage helpers for non-HttpOnly flags only.
 * Access and refresh tokens should remain HttpOnly cookies set by the API / BFF.
 */
export const AUTH_STORAGE_KEY = 'nestlancer.auth.prefs';
