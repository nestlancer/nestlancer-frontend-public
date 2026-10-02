'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AuthUser } from '@nestlancer/types';

import { clearTokens, hasTokens, subscribeToTokens } from './tokenManager';
import type { AuthState } from './types';

interface AuthContextValue extends AuthState {
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  /** Call once after attempting to restore session from the API (success or failure). */
  markHydrated: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [hydrated, setHydrated] = useState(false);
  const [tokenPresent, setTokenPresent] = useState(() => hasTokens());

  useEffect(() => {
    setTokenPresent(hasTokens());
    return subscribeToTokens(() => setTokenPresent(hasTokens()));
  }, []);

  const markHydrated = useCallback(() => {
    setHydrated(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setHydrated(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: !hydrated,
      isAuthenticated: Boolean(user) || (hydrated && tokenPresent),
      setUser,
      logout,
      markHydrated,
    }),
    [user, hydrated, tokenPresent, logout, markHydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
