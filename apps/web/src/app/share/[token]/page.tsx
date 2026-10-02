'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getApiErrorMessage, resolvePublicShare } from '@nestlancer/api-client';
import { landingUrl } from '@nestlancer/constants';
import { Button, NestlancerLogo } from '@nestlancer/ui';
import { safeHttpUrl } from '@nestlancer/utils';

function isPasswordRequiredError(err: unknown): boolean {
  return getApiErrorMessage(err, '').toLowerCase().includes('password');
}

export default function PublicSharePage() {
  const params = useParams();
  const token = String(params.token ?? '');
  const [password, setPassword] = useState('');
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(undefined);

  const shareQ = useQuery({
    queryKey: ['public-share', token, submittedPassword ?? ''],
    queryFn: () => resolvePublicShare(token, { password: submittedPassword }),
    enabled: Boolean(token),
    retry: false,
  });

  const needsPassword = shareQ.isError && isPasswordRequiredError(shareQ.error);
  const isHardError = shareQ.isError && !needsPassword;
  const data = shareQ.isSuccess ? shareQ.data : undefined;
  const filename = data?.filename != null ? String(data.filename) : 'Shared file';
  const mimeType = data?.mimeType != null ? String(data.mimeType) : '';
  const status = data?.status != null ? String(data.status) : '';
  const urls =
    data?.urls && typeof data.urls === 'object' ? (data.urls as Record<string, unknown>) : null;
  const openUrl = safeHttpUrl(
    urls?.default != null
      ? String(urls.default)
      : urls?.download != null
        ? String(urls.download)
        : null
  );

  useEffect(() => {
    if (!isHardError) return;
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) {
      robots.setAttribute('content', 'noindex, nofollow');
      return;
    }
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
  }, [isHardError]);

  useEffect(() => {
    if (isHardError) {
      document.title = 'Share link unavailable · Nestlancer';
    }
  }, [isHardError]);

  return (
    <main
      id="main-content"
      className="public-editorial mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-background p-6 text-foreground"
    >
      <a href={landingUrl('/')} className="mx-auto inline-flex opacity-90 hover:opacity-100">
        <NestlancerLogo variant="full" size="sm" />
      </a>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--elevation-1,0_0_0_1px_hsl(var(--border)))]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-warning/30 bg-warning/10 text-warning">
          🔗
        </div>
        <h1 className="text-center text-xl font-semibold tracking-tight">
          {isHardError ? 'Share link unavailable' : 'Shared deliverable'}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {isHardError
            ? 'This share link is invalid or has expired.'
            : 'This link was shared with you on Nestlancer.'}
        </p>

        {shareQ.isPending ? (
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
                onClick={() => setSubmittedPassword(password.trim() || undefined)}
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

        {data ? (
          <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
            <p className="font-medium">{filename}</p>
            {mimeType ? (
              <p className="font-mono text-xs text-muted-foreground">{mimeType}</p>
            ) : null}
            {status ? <p className="text-xs capitalize text-muted-foreground">{status}</p> : null}
            {openUrl ? (
              <a
                href={openUrl}
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
