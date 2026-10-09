'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { useAuth } from '@nestlancer/auth';
import { resolvePostLoginRedirect } from '@nestlancer/constants';

/**
 * Keeps guest-only auth screens unreachable while a client session is active.
 * Guest-first: render the form while auth bootstraps so Ready is not blocked on
 * session restore. Redirect only after a loaded user is confirmed (not bare tokens),
 * so maintenance / failed profile restore cannot blank the login page.
 *
 * Honors a safe `from` query (same as useLogin) so this guard cannot race and
 * overwrite a deep-link post-login navigation with a hard-coded /dashboard.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || !user || redirected.current) return;
    redirected.current = true;
    // Read from the live URL so we do not need useSearchParams (Suspense) in the auth layout.
    const from =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('from')
        : null;
    router.replace(resolvePostLoginRedirect(from));
  }, [user, isLoading, router]);

  // Do not return null while isLoading — that hid SSR headings until bootstrap
  // finished and pushed auth Ready past the 2s budget on cold loads.
  if (user) {
    return null;
  }

  return children;
}
