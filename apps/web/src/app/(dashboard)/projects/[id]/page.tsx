import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Suspense } from 'react';

import { Skeleton, SkeletonText } from '@nestlancer/ui';
import { isRouteUuid } from '@nestlancer/validators';

export const metadata: Metadata = { title: 'Project' };

import { ProjectDetailClient } from '@/features/projects/ProjectDetailClient';
import { ProjectHubTabBar } from '@/features/projects/hub/ProjectHubTabBar';

function ProjectChromeFallback() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading project">
      <div className="space-y-6">
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <SkeletonText lines={2} />
      </div>
      <div className="-mx-4 border-b border-gray-200 bg-gray-50 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-gray-800 dark:bg-gray-950">
        <ProjectHubTabBar active="overview" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <SkeletonText lines={4} />
      </div>
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return (
    <Suspense fallback={<ProjectChromeFallback />}>
      <ProjectDetailClient id={params.id} />
    </Suspense>
  );
}
