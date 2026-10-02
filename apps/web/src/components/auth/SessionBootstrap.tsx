'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
  fetchMaintenanceStatus,
  isMaintenanceError,
  setMaintenanceStatus,
} from '@nestlancer/api-client/maintenance';
import { hasTokens, trySilentRefresh, useAuth } from '@nestlancer/auth';

import { forceClientLogoutDuringMaintenance } from '@/lib/force-maintenance-logout';
import { coerceAuthUser } from '@/lib/auth-user';
import { apiServices } from '@/lib/axios';
import { restoreImpersonationSession } from '@/lib/impersonationSession';

/**
 * On mount, restores the session from stored access token or HttpOnly refresh cookie (via BFF).
 * During maintenance, clears any client session so public CTAs show Login/Register.
 */
export function SessionBootstrap(): null {
  const { setUser, markHydrated, logout } = useAuth();
  const pathname = usePathname();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (pathname === '/impersonate') {
      markHydrated();
      return;
    }

    void (async () => {
      let underMaintenance = false;

      // Run maintenance probe in parallel with session restore so /requests is not
      // blocked behind a serial round-trip before silent refresh (NL-BUG-PERF-001).
      const maintenancePromise = fetchMaintenanceStatus()
        .then((status) => {
          setMaintenanceStatus(status);
          return status.enabled;
        })
        .catch(() => false);

      const restorePromise = (async () => {
        if (hasTokens()) return;
        const restored = await restoreImpersonationSession();
        if (!restored) {
          await trySilentRefresh();
        }
      })();

      underMaintenance = await maintenancePromise;
      if (underMaintenance) {
        await forceClientLogoutDuringMaintenance(logout);
        markHydrated();
        return;
      }

      await restorePromise;

      if (!hasTokens()) {
        markHydrated();
        return;
      }

      try {
        const profile = await apiServices.users.getProfile();
        const user = coerceAuthUser(profile);
        if (user.role === 'admin') {
          logout();
          return;
        }
        setUser(user);
      } catch (error) {
        if (isMaintenanceError(error)) {
          await forceClientLogoutDuringMaintenance(logout);
          markHydrated();
          return;
        }
        if (!hasTokens()) {
          logout();
        }
      } finally {
        markHydrated();
      }
    })();
  }, [pathname, setUser, markHydrated, logout]);

  return null;
}
