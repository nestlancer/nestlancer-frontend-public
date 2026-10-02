'use client';

import { Skeleton, SkeletonTable } from '@nestlancer/ui';

export function TabPanelSkeleton({
  variant = 'list',
}: {
  variant?: 'list' | 'timeline' | 'cards';
}) {
  if (variant === 'timeline') {
    return (
      <div className="space-y-4 py-2" aria-hidden>
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 pl-2">
            <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return <SkeletonTable rows={4} cols={1} className="py-2" />;
}
