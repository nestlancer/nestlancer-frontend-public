'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { getApiErrorMessage, resolvePublicShare } from '@nestlancer/api-client';
import { landingUrl } from '@nestlancer/constants';
import { Button, NestlancerBrandLink } from '@nestlancer/ui';
import { safeHttpUrl } from '@nestlancer/utils';

export type PublicShareInitial =
  | { kind: 'ok'; data: Record<string, unknown> }
  | { kind: 'password' }
  | { kind: 'error'; message: string };

function isPasswordRequiredError(err: unknown): boolean {
  return getApiErrorMessage(err, '').toLowerCase().includes('password');
}

function sharePayload(data: Record<string, unknown>) {
  const filename = data.filename != null ? String(data.filename) : 'Shared file';
  const mimeType = data.mimeType != null ? String(data.mimeType) : '';
  const status = data.status != null ? String(data.status) : '';
  const urls =
    data.urls && typeof data.urls === 'object' ? (data.urls as Record<string, unknown>) : null;
  const openUrl = safeHttpUrl(
    urls?.default != null
      ? String(urls.default)
      : urls?.download != null
        ? String(urls.download)
        : null
  );
  return { filename, mimeType, status, openUrl };
}

export function PublicShareClient({
  token,
  initial,
}: {
  token: string;
  initial: PublicShareInitial;
}) {
  const [password, setPassword] = useState('');
  // Keep unlocked payload in local state — never put passwords in React Query keys.
  const [unlocked, setUnlocked] = useState<Record<string, unknown> | null>(null);

  const unlockM = useMutation({
    mutationFn: (pwd: string) => resolvePublicShare(token, { password: pwd }),
    onSuccess: (data) => {
      setUnlocked(data);
      setPassword('');
    },
  });

  const needsPassword =
    initial.kind === 'password' &&
    !unlocked &&
    (!unlockM.isError || isPasswordRequiredError(unlockM.error));
  const isHardError =
    initial.kind === 'error' || (unlockM.isError && !isPasswordRequiredError(unlockM.error));
  const data = initial.kind === 'ok' ? initial.data : (unlocked ?? undefined);
  const payload = data ? sharePayload(data) : null;
  const errorMessage =
    initial.kind === 'error'
      ? initial.message
      : unlockM.isError
        ? getApiErrorMessage(unlockM.error, 'This share link is invalid or has expired.')
        : 'This share link is invalid or has expired.';

  return (
    <main
      id="main-content"
      className="public-editorial mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-background p-6 text-foreground"
    >
      <NestlancerBrandLink
        href={landingUrl('/')}
        variant="full"
        size="sm"
        className="mx-auto opacity-90 hover:opacity-100"
      />

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--elevation-1,0_0_0_1px_hsl(var(--border)))]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-warning/30 bg-warning/10 text-warning">
          🔗
        </div>
        <h1 className="text-center text-xl font-semibold tracking-tight">
          {isHardError ? 'Share link unavailable' : 'Shared deliverable'}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {isHardError ? errorMessage : 'This link was shared with you on Nestlancer.'}
        </p>

        {unlockM.isPending ? (
          <div className="mt-6 h-16 animate-pulse rounded-xl bg-muted" aria-hidden />
        ) : null}

        {needsPassword ? (
          <div className="mt-6 space-y-3 text-sm">
            <p className="text-muted-foreground">Password required to unlock this file.</p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter share password"
              />
              <Button
                type="button"
                className="rounded-full"
                disabled={unlockM.isPending || !password.trim()}
                onClick={() => unlockM.mutate(password.trim())}
              >
                Unlock file
              </Button>
            </div>
          </div>
        ) : null}

        {isHardError ? (
          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="rounded-xl border border-border bg-muted/40 p-4 text-muted-foreground">
              Ask the sender for a new link, or return to Nestlancer to continue.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <a href={landingUrl('/')}>Back to Nestlancer</a>
            </Button>
          </div>
        ) : null}

        {payload ? (
          <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
            <p className="font-medium">{payload.filename}</p>
            {payload.mimeType ? (
              <p className="font-mono text-xs text-muted-foreground">{payload.mimeType}</p>
            ) : null}
            {payload.status ? (
              <p className="text-xs capitalize text-muted-foreground">{payload.status}</p>
            ) : null}
            {payload.openUrl ? (
              <a
                href={payload.openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Open file →
              </a>
            ) : (
              <p className="mt-3 text-muted-foreground">
                File metadata loaded. Download may require signing in if the file is private.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
