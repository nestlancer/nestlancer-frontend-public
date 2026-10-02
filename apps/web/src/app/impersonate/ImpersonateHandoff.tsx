'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import {
  ImpersonationMessage,
  clearTokens,
  readImpersonationEndMessage,
  readImpersonationStartMessage,
  setTokens,
  useAuth,
} from '@nestlancer/auth';
import { Button } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';
import { coerceAuthUser } from '@/lib/auth-user';
import { adminHandoffOrigins, setImpersonationMeta } from '@/lib/impersonationSession';

function postReady(opener: Window): void {
  for (const origin of adminHandoffOrigins()) {
    try {
      opener.postMessage({ type: ImpersonationMessage.ready }, origin);
    } catch {
      /* ignore a mismatched target origin */
    }
  }
}

export function ImpersonateHandoff() {
  const searchParams = useSearchParams();
  const done = searchParams.get('done');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  const [message, setMessage] = useState(
    done ? '' : 'Signing in to the client account. Their dashboard will open in this tab.'
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (done) return;
    const opener = window.opener as Window | null;
    if (!opener || opener.closed) {
      setFailed(true);
      setMessage('Open this page with the Impersonate button on the admin user page.');
      return;
    }

    let settled = false;
    const finish = (text: string, isError: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      setFailed(isError);
      setMessage(text);
    };

    const onMessage = (event: MessageEvent) => {
      if (!adminHandoffOrigins().includes(event.origin)) return;
      if (settled) return;
      if (readImpersonationEndMessage(event.data)) {
        finish('The admin console closed this support session.', true);
        void fetch('/api/auth/impersonate', { method: 'DELETE', credentials: 'include' }).finally(
          () => {
            setImpersonationMeta(null);
            clearTokens();
            router.replace('/impersonate?done=remote');
          }
        );
        return;
      }
      const start = readImpersonationStartMessage(event.data);
      if (!start) return;
      for (const origin of adminHandoffOrigins()) {
        try {
          opener.postMessage({ type: ImpersonationMessage.ack }, origin);
        } catch {
          /* ignore a mismatched target origin */
        }
      }
      finish('Signing in to the client account…', false);
      void (async () => {
        try {
          const res = await fetch('/api/auth/impersonate', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: start.accessToken }),
          });
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
            data?: {
              accessToken?: string;
              sessionId?: string;
              email?: string;
              expiresAt?: string;
              expiresIn?: number;
            };
          };
          if (!res.ok || !body.data?.accessToken || !body.data.sessionId || !body.data.expiresAt) {
            throw new Error(body.message || 'The support session could not be stored.');
          }
          setImpersonationMeta({
            sessionId: body.data.sessionId,
            email: body.data.email || start.email || '',
            expiresAt: body.data.expiresAt,
          });
          setTokens({
            accessToken: body.data.accessToken,
            expiresIn: body.data.expiresIn,
          });
          const profile = await apiServices.users.getProfile();
          setUser(coerceAuthUser(profile));
          queryClient.clear();
          router.replace('/dashboard');
        } catch (error) {
          setFailed(true);
          setMessage(getApiErrorMessage(error, 'Could not open this client account.'));
        }
      })();
    };

    window.addEventListener('message', onMessage);
    postReady(opener);
    const interval = window.setInterval(() => postReady(opener), 400);
    const timeout = window.setTimeout(() => {
      finish(
        'The admin tab did not finish opening this account. Go back to the admin user page and click Impersonate again. Use Stop impersonation there if a session was left open.',
        true
      );
    }, 20000);

    return () => {
      settled = true;
      window.removeEventListener('message', onMessage);
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [done, queryClient, router, setUser]);

  const title =
    done === 'remote'
      ? 'Support session closed'
      : done === 'local'
        ? 'Left the client account'
        : 'Opening client account';

  const body =
    done === 'remote'
      ? 'This support session is closed. You can close this tab and return to the admin console.'
      : done === 'local'
        ? 'This tab is signed out. If the admin console was already closed, end the session under Audit Logs → Impersonation sessions so the token stops working.'
        : message;

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {body}
        </p>
        {failed && !done ? (
          <Button className="mt-6" variant="outline" onClick={() => window.close()}>
            Close tab
          </Button>
        ) : null}
      </div>
    </main>
  );
}
