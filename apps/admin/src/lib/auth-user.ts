import type { ApiUserProfile, AuthUser } from '@nestlancer/types';
import { normalizeApiUserRole } from '@nestlancer/types';

export function coerceAuthUser(profile: ApiUserProfile): AuthUser {
  return {
    ...profile,
    emailVerified: profile.emailVerified ?? false,
    role: normalizeApiUserRole(profile.role),
  };
}
