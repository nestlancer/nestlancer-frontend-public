'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import {
  ImpersonationMessage,
  isImpersonationAckMessage,
  isImpersonationReadyMessage,
  readImpersonationClaims,
  readImpersonationEndMessage,
  type ImpersonationStartMessage,
} from '@nestlancer/auth';
import { getWebAppUrl } from '@nestlancer/constants';

import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

export interface ImpersonationHandoffPayload {
  accessToken: string;
  sessionId: string;
  expiresAt: string;
  email?: string;
}

type PendingHandoff = {
  child: Window;
  payload: ImpersonationHandoffPayload;
  timer: number;
};

/** One support tab at a time. Keying by Window identity fails after a cross-origin navigation. */
let pendingHandoff: PendingHandoff | null = null;
/** Kept after the token is delivered so Stop impersonation can sign that tab out. */
let supportTab: Window | null = null;

function asWindow(source: MessageEventSource | null): Window | null {
  if (!source || typeof source !== 'object') return null;
  try {
    if ('closed' in source) return source as Window;
  } catch {
    // Cross-origin windows can throw when inspected. They can still receive postMessage.
    return source as Window;
  }
  return null;
}

function deliver(child: Window, payload: ImpersonationHandoffPayload, origin?: string): void {
  const origins = origin ? [origin] : webHandoffOrigins();
  for (const targetOrigin of origins) {
    try {
      child.postMessage(startMessage(payload), targetOrigin);
    } catch {
      /* target origin does not match the tab yet */
    }
  }
}

function clearPendingHandoff(): void {
  if (!pendingHandoff) return;
  window.clearInterval(pendingHandoff.timer);
  pendingHandoff = null;
}

export function webHandoffOrigins(): string[] {
  const origins = new Set<string>();
  const configured = getWebAppUrl();
  if (configured) {
    try {
      origins.add(new URL(configured).origin);
    } catch {
      /* ignore malformed public URL */
    }
  }
  if (process.env.NODE_ENV === 'production') {
    origins.add('https://app.nestlancer.com');
  }
  return [...origins];
}

export function clientImpersonationUrl(): string | null {
  const origins = webHandoffOrigins();
  const origin = origins[0];
  return origin ? `${origin}/impersonate` : null;
}

/** Push the support token until the client tab acknowledges it. */
export function registerImpersonationHandoff(
  child: Window,
  payload: ImpersonationHandoffPayload
): void {
  clearPendingHandoff();
  const timer = window.setInterval(() => {
    if (child.closed) {
      clearPendingHandoff();
      return;
    }
    deliver(child, payload);
  }, 300);
  supportTab = child;
  pendingHandoff = { child, payload, timer };
  deliver(child, payload);
  window.setTimeout(() => {
    if (pendingHandoff?.child === child) clearPendingHandoff();
  }, 25_000);
}

/** Tell the open client tab to leave the support session. */
export function notifyImpersonationEnded(sessionId: string): void {
  const child = supportTab ?? pendingHandoff?.child ?? null;
  supportTab = null;
  clearPendingHandoff();
  if (!child || child.closed) return;
  for (const origin of webHandoffOrigins()) {
    try {
      child.postMessage({ type: ImpersonationMessage.end, sessionId }, origin);
    } catch {
      /* tab already navigated away */
    }
  }
}

function startMessage(payload: ImpersonationHandoffPayload): ImpersonationStartMessage {
  return {
    type: ImpersonationMessage.start,
    accessToken: payload.accessToken,
    sessionId: payload.sessionId,
    expiresAt: payload.expiresAt,
    email: payload.email,
  };
}

export function readImpersonationHandoff(raw: unknown): ImpersonationHandoffPayload | null {
  const records: unknown[] = [raw];
  if (raw && typeof raw === 'object' && 'data' in raw) {
    records.push((raw as { data?: unknown }).data);
  }

  for (const record of records) {
    if (!record || typeof record !== 'object') continue;
    const row = record as Record<string, unknown>;
    const accessToken =
      typeof row.token === 'string'
        ? row.token
        : typeof row.accessToken === 'string'
          ? row.accessToken
          : '';
    const claims = accessToken ? readImpersonationClaims(accessToken) : null;
    if (!claims) continue;
    const sessionId =
      typeof row.impersonationSessionId === 'string'
        ? row.impersonationSessionId
        : claims.sessionId;
    if (sessionId !== claims.sessionId) continue;
    const expiresAt =
      typeof row.expiresAt === 'string' ? row.expiresAt : new Date(claims.exp * 1000).toISOString();
    const user = row.impersonatedUser;
    const email =
      user && typeof user === 'object' && typeof (user as { email?: unknown }).email === 'string'
        ? (user as { email: string }).email
        : claims.email;
    return { accessToken, sessionId, expiresAt, email };
  }

  return null;
}

export function ImpersonationHandoffListener(): null {
  const qc = useQueryClient();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!webHandoffOrigins().includes(event.origin)) return;
      const source = asWindow(event.source);

      if (isImpersonationAckMessage(event.data)) {
        clearPendingHandoff();
        return;
      }

      if (isImpersonationReadyMessage(event.data)) {
        const payload = pendingHandoff?.payload;
        if (!payload) return;
        const child = source ?? pendingHandoff?.child;
        if (!child) return;
        deliver(child, payload, event.origin);
        return;
      }

      const end = readImpersonationEndMessage(event.data);
      if (!end) return;
      void apiServices.admin
        .endImpersonationAlias({ sessionId: end.sessionId })
        .then(() => {
          toast.success('Stopped acting as the client.');
          void qc.invalidateQueries({ queryKey: adminKeys.impersonationSessions() });
        })
        .catch((error: unknown) => {
          toast.error(
            getApiErrorMessage(
              error,
              'Could not close the support session. End it under Audit Logs → Impersonation sessions.'
            )
          );
        });
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [qc]);

  return null;
}
