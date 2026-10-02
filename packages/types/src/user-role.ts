import type { AuthUser } from './api/auth';

/**
 * Maps gateway / Prisma roles (`USER`, `ADMIN`) into UI roles.
 * `USER` is the client-facing account; `ADMIN` is the operator console.
 */
export function normalizeApiUserRole(raw: string | undefined | null): AuthUser['role'] {
  const v = (raw ?? '').trim();
  if (!v) return 'client';
  const upper = v.toUpperCase();
  if (upper === 'USER' || upper === 'CLIENT') return 'client';
  if (upper === 'ADMIN') return 'admin';
  const lower = v.toLowerCase();
  if (lower === 'client' || lower === 'admin') {
    return lower as AuthUser['role'];
  }
  return 'client';
}
