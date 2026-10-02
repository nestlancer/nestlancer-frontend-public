import { Skeleton, SkeletonText } from '@nestlancer/ui';

import { ProjectHubTabBar } from '@/features/projects/hub/ProjectHubTabBar';

/** NL-PROG-002 / NL-UI-014: keep project chrome (tabs) visible during cold load. */
export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading project">
      <div className="space-y-6">
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <SkeletonText lines={2} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="-mx-4 border-b border-gray-200 bg-gray-50 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-gray-800 dark:bg-gray-950">
        <ProjectHubTabBar active="overview" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <SkeletonText lines={4} />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
