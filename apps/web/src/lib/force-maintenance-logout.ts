'use client';

/**
 * Clears client session when maintenance starts so public pages show Login/Register
 * instead of Dashboard, and dashboard routes cannot silently restore.
 */
export async function forceClientLogoutDuringMaintenance(logout: () => void): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      await fetch(`${window.location.origin}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => undefined);
    }
  } finally {
    logout();
  }
}
