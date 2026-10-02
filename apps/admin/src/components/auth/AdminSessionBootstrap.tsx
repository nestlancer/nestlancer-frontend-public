'use client';

import { useEffect, useRef } from 'react';

import { hasTokens, trySilentRefresh, useAuth } from '@nestlancer/auth';

import { coerceAuthUser } from '@/lib/auth-user';
import { apiServices } from '@/lib/axios';

/** Restores operator session from memory or HttpOnly refresh cookie. */
export function AdminSessionBootstrap(): null {
  const { setUser, markHydrated, logout } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      if (!hasTokens()) {
        await trySilentRefresh();
      }

      if (!hasTokens()) {
        markHydrated();
        return;
      }

      try {
        const profile = await apiServices.users.getProfile();
        const user = coerceAuthUser(profile);
        if (user.role !== 'admin') {
          logout();
          return;
        }
        setUser(user);
      } catch {
        if (!hasTokens()) {
          logout();
        }
      } finally {
        markHydrated();
      }
    })();
  }, [setUser, markHydrated, logout]);

  return null;
}
