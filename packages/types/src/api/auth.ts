export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  emailVerified: boolean;
  role: 'client' | 'admin';
}

export interface AuthSession {
  user: AuthUser;
  accessTokenExpiresAt: number;
}
