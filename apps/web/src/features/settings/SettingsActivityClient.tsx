'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@nestlancer/ui';

import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { activityLogToRows } from '@/lib/user-dashboard-view-model';
import { webListShellClass } from '@/lib/tailadmin-classes';

export function SettingsActivityClient() {
  const q = useQuery({
    queryKey: queryKeys.users.activity(1),
    queryFn: () => apiServices.users.getActivity({ limit: 50 }),
  });

  const rows = activityLogToRows(q.data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Recent actions on your account — logins, updates, and project events.
      </p>

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <WebPanel key={i} padding="sm">
              <Skeleton className="h-4 w-40" />
              <SkeletonText className="mt-2" lines={2} />
            </WebPanel>
          ))}
        </div>
      ) : null}

      {!q.isLoading && q.error ? (
        <ErrorState
          message={getApiErrorMessage(q.error, 'Could not load activity log')}
          onRetry={() => void q.refetch()}
        />
      ) : null}

      {!q.isLoading && !q.error && rows.length === 0 ? (
        <WebPanel padding="lg" className="text-center">
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title="No activity yet"
            description="Actions on your account will appear here."
          />
        </WebPanel>
      ) : null}

      {!q.isLoading && !q.error && rows.length > 0 ? (
        <ul className={`${webListShellClass} divide-y divide-gray-200 dark:divide-gray-800`}>
          {rows.map((row) => (
            <li key={row.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{row.title}</p>
                  {row.detail ? (
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{row.detail}</p>
                  ) : null}
                </div>
                {row.time ? (
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {row.time}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
