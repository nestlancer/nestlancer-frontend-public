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
import { buildLoginHref, routes } from '@nestlancer/constants';

import { apiServices } from '@/lib/axios';

function WebAuthLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" aria-busy="true" aria-live="polite">
      <div className="border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="h-5 w-36 animate-pulse rounded bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4 sm:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3 rounded-2xl border border-border/60 bg-card p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/80" />
          ))}
        </div>
        <p className="sr-only">Loading your workspace…</p>
      </div>
    </div>
  );
}

/**
 * Protects client dashboard routes. Edge middleware checks HttpOnly cookies;
 * this guard handles expired sessions in open tabs and redirects with a safe `from` path.
 */
export function WebAuthGuard({ children }: { children: ReactNode }) {
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
      const from =
        pathname && pathname !== routes.login && pathname.startsWith('/')
          ? pathname
          : routes.dashboard;
      router.replace(buildLoginHref(from));
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
        /* 401 → refresh interceptor; failed refresh → subscribeSessionExpired */
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
    return <WebAuthLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
