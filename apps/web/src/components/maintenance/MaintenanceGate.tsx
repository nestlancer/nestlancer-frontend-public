'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  fetchMaintenanceStatus,
  getMaintenanceStatus,
  setMaintenanceStatus,
  subscribeMaintenance,
  type MaintenanceInfo,
} from '@nestlancer/api-client/maintenance';
import { hasTokens, useAuth } from '@nestlancer/auth';
import { NestlancerLogo } from '@nestlancer/ui';

import { forceClientLogoutDuringMaintenance } from '@/lib/force-maintenance-logout';

const POLL_WHILE_ENABLED_MS = 30_000;
const POLL_WHILE_DISABLED_MS = 90_000;

/** Public marketing / SEO pages stay readable during platform maintenance. */
function isPublicContentPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const p = pathname.split('?')[0] || '/';
  if (p === '/') return true;
  // Bookmarks require an authenticated session — treat as app surface.
  if (p === '/blog/bookmarks' || p.startsWith('/blog/bookmarks/')) return false;
  const roots = [
    '/portfolio',
    '/blog',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/work',
    '/verify-document',
  ];
  return roots.some((root) => p === root || p.startsWith(`${root}/`));
}

function formatEstimatedEnd(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function AvailabilitySplash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <NestlancerLogo variant="icon" size="md" />
        <p className="text-sm text-muted-foreground">Checking platform availability…</p>
      </div>
    </div>
  );
}

function MaintenanceScreen({ status }: { status: MaintenanceInfo }) {
  const eta = formatEstimatedEnd(status.estimatedEnd);
  const message =
    status.message?.trim() ||
    'We are performing scheduled maintenance to keep Nestlancer reliable. Please check back soon.';

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ta-brand-950 px-6 py-16 text-white">
      <div
        className="maintenance-gate-bg pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center animate-in fade-in duration-500">
        <NestlancerLogo variant="full" size="md" theme="dark" />
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">
          Temporarily unavailable
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Nestlancer is under maintenance
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-white/70">{message}</p>
        {eta ? (
          <p className="mt-6 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85">
            Expected back around <span className="font-medium text-white">{eta}</span>
          </p>
        ) : (
          <p className="mt-6 text-sm text-white/50">We will restore access as soon as we can.</p>
        )}
        <p className="mt-10 text-xs text-white/40">This page refreshes automatically.</p>
      </div>
    </div>
  );
}

/**
 * Blocks authenticated/client app surfaces during maintenance.
 * Public portfolio/blog/marketing pages remain available.
 * Active client sessions are cleared so homepage CTAs show Login/Register.
 */
export function MaintenanceGate({
  children,
  initialStatus,
}: {
  children: ReactNode;
  initialStatus?: MaintenanceInfo | null;
}) {
  const pathname = usePathname();
  const publicContent = isPublicContentPath(pathname);
  const { logout } = useAuth();
  const [status, setStatus] = useState<MaintenanceInfo>(
    () => initialStatus ?? getMaintenanceStatus()
  );
  const [ready, setReady] = useState(() => Boolean(initialStatus));
  const wasEnabled = useRef(Boolean(initialStatus?.enabled));
  const logoutInFlight = useRef(false);

  useEffect(() => {
    const clearSessionIfNeeded = (enabled: boolean) => {
      if (!enabled || logoutInFlight.current) return;
      if (!hasTokens()) {
        // Still clear React auth user if present.
        logout();
        return;
      }
      logoutInFlight.current = true;
      void forceClientLogoutDuringMaintenance(logout).finally(() => {
        logoutInFlight.current = false;
      });
    };

    if (initialStatus) {
      setMaintenanceStatus(initialStatus);
      clearSessionIfNeeded(Boolean(initialStatus.enabled));
    }

    const unsub = subscribeMaintenance((next) => {
      if (wasEnabled.current && !next.enabled) {
        window.location.reload();
        return;
      }
      if (next.enabled) {
        clearSessionIfNeeded(true);
      }
      wasEnabled.current = next.enabled;
      setStatus(next);
    });

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const next = await fetchMaintenanceStatus();
        if (cancelled) return;
        setMaintenanceStatus(next);
      } catch {
        // Fail open so a status outage does not brick the app.
      } finally {
        if (!cancelled) setReady(true);
      }

      if (cancelled) return;
      const delay = getMaintenanceStatus().enabled ? POLL_WHILE_ENABLED_MS : POLL_WHILE_DISABLED_MS;
      timer = setTimeout(() => {
        void tick();
      }, delay);
    };

    void tick();

    return () => {
      cancelled = true;
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [initialStatus, logout]);

  if (!ready && !publicContent) return <AvailabilitySplash />;
  if (status.enabled && !publicContent) return <MaintenanceScreen status={status} />;
  return children;
}
