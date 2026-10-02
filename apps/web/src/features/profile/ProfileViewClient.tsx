'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Settings } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { safeNavigationUrl } from '@nestlancer/utils';
import { queryKeys, routes } from '@nestlancer/constants';
import { Button, ErrorState, Skeleton, SkeletonText } from '@nestlancer/ui';

import { PageHeader } from '@nestlancer/ui';
import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';

function initials(first?: string, last?: string, email?: string) {
  const a = first?.[0];
  const b = last?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  if (a) return a.toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export function ProfileViewClient() {
  const q = useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: () => apiServices.users.getProfile(),
  });

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-8 w-56" />
        <SkeletonText lines={3} />
      </div>
    );
  }
  if (q.isError) {
    return (
      <ErrorState
        title="Could not load profile"
        message={getApiErrorMessage(q.error, 'Could not load profile')}
        onRetry={() => void q.refetch()}
      />
    );
  }

  const u = q.data;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Your profile';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Profile"
        description="How you appear on Nestlancer — name, headline, bio, and skills."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={routes.profileEdit}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit profile
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={routes.settingsAccount}>
                <Settings className="h-4 w-4" aria-hidden />
                Account settings
              </Link>
            </Button>
          </div>
        }
      />

      <WebPanel padding="lg">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {safeNavigationUrl(u.avatarUrl != null ? String(u.avatarUrl) : null) ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote user avatar URL
            <img
              src={safeNavigationUrl(u.avatarUrl != null ? String(u.avatarUrl) : null) ?? undefined}
              alt=""
              className="h-28 w-28 rounded-2xl border border-border/60 object-cover shadow-md"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-ta-brand-500/15 font-display text-3xl font-semibold text-ta-brand-600 shadow-inner ring-1 ring-ta-brand-500/20 dark:text-ta-brand-400">
              {initials(u.firstName, u.lastName, u.email)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
            {u.headline ? (
              <p className="mt-4 text-base font-medium text-gray-800 dark:text-white/90">
                {u.headline}
              </p>
            ) : null}
            {u.bio ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {u.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No bio yet. Add one so collaborators know what you do.
              </p>
            )}
            {u.skills?.length ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {u.skills.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-300"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </WebPanel>

      <WebPanel padding="md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Looking for security or notifications?
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Password, 2FA, and delivery preferences live in Settings.
            </p>
          </div>
          <Button variant="outline" className="shrink-0 rounded-xl" asChild>
            <Link href={routes.settingsAccount}>Open settings</Link>
          </Button>
        </div>
      </WebPanel>
    </div>
  );
}
