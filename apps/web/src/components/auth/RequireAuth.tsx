'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { useAuth } from '@nestlancer/auth';
import { buildLoginHref, routes } from '@nestlancer/constants';

/**
 * Redirects unauthenticated visitors away from client-only pages that live
 * outside the dashboard route group (e.g. /blog/bookmarks).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || redirected.current) return;
    redirected.current = true;
    const from = pathname && pathname.startsWith('/') ? pathname : routes.dashboard;
    router.replace(buildLoginHref(from));
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return children;
}
