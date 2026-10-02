'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { useAuth } from '@nestlancer/auth';
import { routes } from '@nestlancer/constants';

/**
 * Keeps guest-only auth screens unreachable while a client session is active.
 * Guest-first: render the form while auth bootstraps so Ready is not blocked on
 * session restore. Redirect only after a loaded user is confirmed (not bare tokens),
 * so maintenance / failed profile restore cannot blank the login page.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || !user || redirected.current) return;
    redirected.current = true;
    router.replace(routes.dashboard);
  }, [user, isLoading, router]);

  // Do not return null while isLoading — that hid SSR headings until bootstrap
  // finished and pushed auth Ready past the 2s budget on cold loads.
  if (user) {
    return null;
  }

  return children;
}
