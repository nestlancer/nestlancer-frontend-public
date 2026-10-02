'use client';

import { useEffect } from 'react';

import { clearTokens, readImpersonationEndMessage } from '@nestlancer/auth';

import {
  adminHandoffOrigins,
  getImpersonationMeta,
  setImpersonationMeta,
} from '@/lib/impersonationSession';

/** Signs this tab out when the admin user page clicks Stop impersonation. */
export function ImpersonationRemoteStop(): null {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!adminHandoffOrigins().includes(event.origin)) return;
      const end = readImpersonationEndMessage(event.data);
      if (!end) return;
      const meta = getImpersonationMeta();
      if (!meta || meta.sessionId !== end.sessionId) return;
      void fetch('/api/auth/impersonate', { method: 'DELETE', credentials: 'include' }).finally(
        () => {
          setImpersonationMeta(null);
          clearTokens();
          window.location.assign('/impersonate?done=remote');
        }
      );
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return null;
}
