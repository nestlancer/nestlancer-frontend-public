import type { AuthUser } from './auth';

/** Profile from `GET /users/profile` — gateway fields may omit defaults the UI fills in. */
export type ApiUserProfile = Omit<AuthUser, 'role' | 'emailVerified'> &
  Partial<Pick<AuthUser, 'role' | 'emailVerified' | 'phone'>> & {
    bio?: string;
    headline?: string;
    skills?: string[];
    avatarUrl?: string;
  };

export interface UserProfile extends AuthUser {
  bio?: string;
  headline?: string;
  skills?: string[];
  avatarUrl?: string;
}
