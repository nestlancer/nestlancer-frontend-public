'use client';

import { useEffect, useState } from 'react';

import {
  fetchMaintenanceStatus,
  getMaintenanceStatus,
  setMaintenanceStatus,
  subscribeMaintenance,
  type MaintenanceInfo,
} from '@nestlancer/api-client/maintenance';
import { AlertTriangle } from '@nestlancer/ui/icons';

const POLL_MS = 45_000;

function formatEta(value: string | null): string | null {
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

/**
 * Operator-facing notice while platform maintenance is enabled.
 * Does not block admin login or console access.
 */
export function AdminMaintenanceBanner() {
  const [status, setStatus] = useState<MaintenanceInfo>(() => getMaintenanceStatus());

  useEffect(() => {
    const unsub = subscribeMaintenance(setStatus);

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const next = await fetchMaintenanceStatus();
        if (!cancelled) setMaintenanceStatus(next);
      } catch {
        // ignore — admin console remains usable
      }
      if (cancelled) return;
      timer = setTimeout(() => {
        void tick();
      }, POLL_MS);
    };

    void tick();

    return () => {
      cancelled = true;
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!status.enabled) return null;

  const eta = formatEta(status.estimatedEnd);
  const message =
    status.message?.trim() ||
    'Client apps are blocked. Operators can continue working and disable maintenance from System → Operations.';

  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-amber-950 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-2.5 text-sm sm:items-center">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Maintenance mode is on</p>
          <p className="mt-0.5 text-xs text-amber-900/80 dark:text-amber-100/75 sm:text-sm">
            {message}
            {eta ? ` · Expected end ${eta}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
