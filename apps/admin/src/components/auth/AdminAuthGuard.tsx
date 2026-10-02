'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from '@nestlancer/ui';

import {
  getAccessTokenExpiresAt,
  hasTokens,
  subscribeSessionExpired,
  useAuth,
} from '@nestlancer/auth';

import { apiServices } from '@/lib/axios';

function AdminAuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="ge-card px-8 py-6 text-center">
        <p className="text-sm text-muted-foreground">Loading operator session…</p>
      </div>
    </div>
  );
}

/**
 * Protects dashboard routes on the client. Edge middleware only checks cookie presence;
 * when access expires in an open tab, API refresh may fail without navigation unless
 * this guard clears auth state and sends the operator back to sign-in.
 */
export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const redirecting = useRef(false);

  const redirectToLogin = useCallback(
    (options?: { sessionExpired?: boolean }) => {
      if (redirecting.current) return;
      redirecting.current = true;
      if (options?.sessionExpired) {
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
        });
      }
      logout();
      queryClient.clear();
      const from = pathname && pathname !== '/login' ? pathname : '/dashboard';
      router.replace(`/login?from=${encodeURIComponent(from)}`);
    },
    [logout, pathname, queryClient, router]
  );

  useEffect(() => {
    return subscribeSessionExpired(() => {
      redirectToLogin({ sessionExpired: true });
    });
  }, [redirectToLogin]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirectToLogin();
    }
  }, [isLoading, isAuthenticated, redirectToLogin]);

  useEffect(() => {
    const verifySession = () => {
      if (isLoading) return;
      if (!hasTokens()) {
        redirectToLogin();
        return;
      }
      const expiresAt = getAccessTokenExpiresAt();
      const refreshSkewMs = 60_000;
      if (expiresAt != null && Date.now() + refreshSkewMs < expiresAt) return;
      void apiServices.users.getProfile().catch(() => {
        /* 401 triggers token refresh via interceptor; failed refresh → subscribeSessionExpired */
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        verifySession();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(verifySession, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [isLoading, redirectToLogin]);

  if (isLoading) {
    return <AdminAuthLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
