import type { Metadata } from 'next';
import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { AdminProjectDetailClient } from '@/features/projects/AdminProjectDetailClient';

/**
 * Static / probe segments that must not be treated as project UUIDs.
 */
const RESERVED_PROJECT_SEGMENTS = new Set(['archive', 'completed', 'new', 'stats', 'templates']);

const PROJECT_HUB_REDIRECTS: Record<string, string> = {
  archive: '/projects/archive',
  completed: '/projects/completed',
  new: '/projects/new',
  stats: '/projects/stats',
};

export const metadata: Metadata = { title: 'Project detail' };

export default function AdminProjectDetailPage({ params }: { params: { id: string } }) {
  if (RESERVED_PROJECT_SEGMENTS.has(params.id)) {
    redirect(PROJECT_HUB_REDIRECTS[params.id] ?? '/projects');
  }
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground">
          Loading project…
        </div>
      }
    >
      <AdminProjectDetailClient projectId={params.id} />
    </Suspense>
  );
}
