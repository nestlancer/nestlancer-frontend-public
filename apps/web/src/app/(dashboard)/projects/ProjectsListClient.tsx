'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Plus } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import type { ProjectSummary } from '@nestlancer/types';
import {
  Button,
  cn,
  DomainStatusBadge,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonTable,
} from '@nestlancer/ui';
import { apiServices } from '@/lib/axios';
import { ClientListPage } from '@/components/web/ClientListPage';
import { webListCardClass, webPrimaryButtonClass } from '@/lib/tailadmin-classes';

export function ProjectsListClient({ status }: { status?: 'ARCHIVED' | 'COMPLETED' }) {
  const {
    data = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.projects.list({}),
    queryFn: () => apiServices.projects.list(),
  });

  const items = (data as ProjectSummary[]).filter((project) =>
    status ? String(project.status).toUpperCase() === status : true
  );
  const title =
    status === 'ARCHIVED'
      ? 'Archived projects'
      : status === 'COMPLETED'
        ? 'Completed projects'
        : 'Projects';
  const description = status
    ? 'Projects in this state, using the same cards as the main projects list.'
    : 'Follow active work, milestones, and delivery from kickoff through completion.';

  return (
    <ClientListPage>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`${routes.requests}?view=all`}>Work Hub</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={routes.quotes}>View quotes</Link>
            </Button>
          </div>
        }
      />

      {isError ? (
        <ErrorState
          title="Could not load projects"
          message={getApiErrorMessage(error, 'Could not load projects')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {isPending ? <SkeletonTable rows={6} cols={3} /> : null}

      {!isPending && !isError && items.length === 0 ? (
        <EmptyState
          title={status ? 'Nothing in this list' : 'No projects yet'}
          description={
            status
              ? 'Projects move here when their status matches this list.'
              : 'Accept a quote on your request to open a project here automatically.'
          }
          action={
            <Button className={webPrimaryButtonClass} asChild>
              <Link href={routes.requests}>
                <Plus className="h-4 w-4" aria-hidden />
                View my requests
              </Link>
            </Button>
          }
        />
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {!isPending &&
          !isError &&
          items.map((p) => (
            <li key={p.id}>
              <Link
                href={routes.project(p.id)}
                className={cn(
                  webListCardClass,
                  'hover:border-ta-brand-500/35 hover:shadow-theme-sm active:scale-[0.99]'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ta-brand-50 text-ta-brand-600 ring-1 ring-ta-brand-500/15 dark:bg-ta-brand-500/[0.12] dark:text-ta-brand-400">
                    <FolderKanban className="h-5 w-5" aria-hidden />
                  </span>
                  <DomainStatusBadge domain="project" status={String(p.status)} />
                </div>
                <p className="mt-4 font-display text-lg font-semibold leading-snug text-foreground group-hover:text-ta-brand-600 dark:group-hover:text-ta-brand-400">
                  {p.title}
                </p>
                {p.createdAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Started {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
      </ul>
    </ClientListPage>
  );
}
