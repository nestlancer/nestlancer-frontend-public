/** RFC 4122 UUID (any version) — used to gate dynamic detail routes before API calls. */
const ROUTE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * True when `id` is a UUID suitable for `/resource/[id]` detail pages.
 * Rejects reserved path segments (`stats`, `capacity`, `revenue`, …) so they
 * never get forwarded to the API as path params (NL-BUG-STATE-01).
 */
export function isRouteUuid(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return ROUTE_UUID_RE.test(id.trim());
}
