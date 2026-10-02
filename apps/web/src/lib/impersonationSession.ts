'use client';

import { useSyncExternalStore } from 'react';

import { ImpersonationMessage, clearTokens, setActingAsUser, setTokens } from '@nestlancer/auth';
import { getAdminAppUrl } from '@nestlancer/constants';

export interface ImpersonationMeta {
  sessionId: string;
  email: string;
  expiresAt: string;
}

let meta: ImpersonationMeta | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function getImpersonationMeta(): ImpersonationMeta | null {
  return meta;
}

export function setImpersonationMeta(next: ImpersonationMeta | null): void {
  meta = next;
  setActingAsUser(next != null);
  emit();
}

export function subscribeImpersonationMeta(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useImpersonationMeta(): ImpersonationMeta | null {
  return useSyncExternalStore(subscribeImpersonationMeta, getImpersonationMeta, () => null);
}

export function adminHandoffOrigins(): string[] {
  const origins = new Set<string>();
  const configured = getAdminAppUrl();
  if (configured) {
    try {
      origins.add(new URL(configured).origin);
    } catch {
      /* ignore malformed public URL */
    }
  }
  if (process.env.NODE_ENV === 'production') {
    origins.add('https://admin.nestlancer.com');
  }
  return [...origins];
}

interface StoredSession {
  accessToken?: string;
  sessionId?: string;
  email?: string;
  expiresAt?: string;
  expiresIn?: number;
}

/** Puts a support session back into memory after a reload. */
export async function restoreImpersonationSession(): Promise<ImpersonationMeta | null> {
  try {
    const res = await fetch('/api/auth/impersonate', { credentials: 'include' });
    if (res.status === 204 || !res.ok) return null;
    const body = (await res.json()) as { data?: StoredSession };
    const session = body.data;
    if (!session?.accessToken || !session.sessionId || !session.expiresAt) return null;
    setImpersonationMeta({
      sessionId: session.sessionId,
      email: session.email ?? '',
      expiresAt: session.expiresAt,
    });
    setTokens({
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
    });
    return getImpersonationMeta();
  } catch {
    return null;
  }
}

/** Clears this tab and asks the still-open admin tab to end the server session. */
export async function stopActingAsUser(): Promise<'remote' | 'local'> {
  const current = getImpersonationMeta();
  const opener = window.opener as Window | null;
  let toldAdmin = false;
  if (current && opener && !opener.closed) {
    for (const origin of adminHandoffOrigins()) {
      try {
        opener.postMessage(
          { type: ImpersonationMessage.end, sessionId: current.sessionId },
          origin
        );
        toldAdmin = true;
      } catch {
        /* target origin rejected the message */
      }
    }
  }

  await fetch('/api/auth/impersonate', { method: 'DELETE', credentials: 'include' }).catch(
    () => undefined
  );
  setImpersonationMeta(null);
  clearTokens();
  return toldAdmin ? 'remote' : 'local';
}
