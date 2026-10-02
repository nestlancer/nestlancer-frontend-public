'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useQueries } from '@tanstack/react-query';

import { Button, cn } from '@nestlancer/ui';
import { ChevronRight } from '@nestlancer/ui/icons';

import { GeCard, GeCardHeader, GePageHeader } from '@/components/admin/AdminGentelellaUI';
import { countAdminEndpoints } from '@/lib/admin-endpoints';
import {
  ADMIN_PIPELINES,
  ADMIN_STANDALONE_MODULES,
  getModuleEndpoints,
  getStageEndpoints,
  type AdminPipeline,
  type PipelineStage,
} from '@/lib/admin-pipelines';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination } from '@/lib/admin-response';
import { extractMetricTiles } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

import { PipelineHubTabs } from './PipelineHubTabs';

function metricFromStats(data: unknown, fallback?: string): string | undefined {
  const tiles = extractMetricTiles(data, '');
  if (tiles[0]?.value) return tiles[0].value;
  return fallback;
}

function totalFromList(data: unknown): string | undefined {
  const p = pickAdminPagination(data);
  if (p?.total != null) return String(p.total);
  return undefined;
}

function PipelineStageCard({
  stage,
  metric,
  isLast,
}: {
  stage: PipelineStage;
  metric?: string;
  isLast: boolean;
}) {
  const Icon = stage.icon;

  return (
    <>
      <Link
        href={stage.href}
        className="group flex min-w-[140px] flex-1 flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-[var(--ge-primary)] hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--ge-primary)]/10 text-[var(--ge-primary)]">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          {metric ? (
            <span className="text-lg font-semibold tabular-nums text-foreground">{metric}</span>
          ) : null}
        </div>
        <p className="mt-3 font-medium text-foreground">{stage.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {stage.operatorAction}
        </p>
        <p className="mt-3 text-xs font-medium text-[var(--ge-primary)] opacity-0 transition-opacity group-hover:opacity-100">
          Open →
        </p>
      </Link>
      {!isLast ? (
        <ChevronRight
          className="mx-1 hidden h-5 w-5 shrink-0 self-center text-muted-foreground/50 sm:block"
          aria-hidden
        />
      ) : null}
    </>
  );
}

function PipelineSection({
  pipeline,
  metrics,
}: {
  pipeline: AdminPipeline;
  metrics: Record<string, string | undefined>;
}) {
  return (
    <GeCard flush>
      <GeCardHeader title={pipeline.title} subtitle={pipeline.description} />
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Serves:</span> {pipeline.audience}
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-stretch sm:overflow-x-auto">
        {pipeline.stages.map((stage, i) => (
          <PipelineStageCard
            key={stage.id}
            stage={stage}
            metric={metrics[stage.id]}
            isLast={i === pipeline.stages.length - 1}
          />
        ))}
      </div>
    </GeCard>
  );
}

function EndpointReference() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <GeCard flush>
      <GeCardHeader
        title="Admin API reference"
        subtitle={`${countAdminEndpoints()} endpoints across ${ADMIN_STANDALONE_MODULES.length + ADMIN_PIPELINES.reduce((n, p) => n + p.stages.length, 0)} feature areas · base path /api/v1`}
      />
      <div className="divide-y divide-border border-t border-border">
        {ADMIN_PIPELINES.flatMap((p) => p.stages).map((stage) => {
          const endpoints = getStageEndpoints(stage);
          const open = openGroup === stage.id;
          return (
            <div key={stage.id}>
              <button
                type="button"
                onClick={() => setOpenGroup(open ? null : stage.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/30"
              >
                <span className="font-medium">{stage.label}</span>
                <span className="text-xs text-muted-foreground">
                  {endpoints.length} endpoints {open ? '▾' : '▸'}
                </span>
              </button>
              {open ? (
                <ul className="space-y-1 bg-muted/10 px-4 py-3">
                  {endpoints.map((ep) => (
                    <li
                      key={`${ep.method}-${ep.path}`}
                      className="font-mono text-[11px] text-muted-foreground"
                    >
                      <span
                        className={cn(
                          'mr-2 inline-block min-w-[3rem] rounded px-1 py-0.5 text-center text-[10px] font-semibold',
                          ep.method === 'GET' &&
                            'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                          ep.method === 'POST' && 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
                          ep.method === 'PATCH' &&
                            'bg-amber-500/15 text-amber-800 dark:text-amber-300',
                          ep.method === 'DELETE' && 'bg-red-500/15 text-red-700 dark:text-red-400'
                        )}
                      >
                        {ep.method}
                      </span>
                      {ep.path}
                      <span className="ml-2 font-sans text-muted-foreground">— {ep.summary}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
        {ADMIN_STANDALONE_MODULES.map((mod) => {
          const endpoints = getModuleEndpoints(mod.endpointGroupId);
          const open = openGroup === mod.id;
          return (
            <div key={mod.id}>
              <button
                type="button"
                onClick={() => setOpenGroup(open ? null : mod.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/30"
              >
                <span className="font-medium">{mod.label}</span>
                <span className="text-xs text-muted-foreground">
                  {endpoints.length} endpoints {open ? '▾' : '▸'}
                </span>
              </button>
              {open ? (
                <ul className="space-y-1 bg-muted/10 px-4 py-3">
                  {endpoints.map((ep) => (
                    <li
                      key={`${ep.method}-${ep.path}`}
                      className="font-mono text-[11px] text-muted-foreground"
                    >
                      <span className="mr-2 inline-block min-w-[3rem] rounded bg-muted px-1 py-0.5 text-center text-[10px] font-semibold">
                        {ep.method}
                      </span>
                      {ep.path} — {ep.summary}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </GeCard>
  );
}

export function PipelineHubClient() {
  const results = useQueries({
    queries: [
      {
        queryKey: [...adminKeys.contact(), 'pipeline-count'],
        queryFn: () => apiServices.admin.listContactMessages({ page: 1, limit: 1 }),
        staleTime: 60_000,
      },
      {
        queryKey: adminKeys.requestStats(),
        queryFn: () => apiServices.admin.getAdminRequestStats(),
        staleTime: 60_000,
      },
      {
        queryKey: adminKeys.quoteStats(),
        queryFn: () => apiServices.admin.getAdminQuoteStats(),
        staleTime: 60_000,
      },
      {
        queryKey: adminKeys.projectsStats(),
        queryFn: () => apiServices.admin.getProjectStats(),
        staleTime: 60_000,
      },
      {
        queryKey: [...adminKeys.payments(), 'pipeline-count'],
        queryFn: () => apiServices.admin.listAdminPayments({ page: 1, limit: 1 }),
        staleTime: 60_000,
      },
      {
        queryKey: [...adminKeys.users(), 'pipeline-count'],
        queryFn: () => apiServices.admin.listUsers({ page: 1, limit: 1 }),
        staleTime: 60_000,
      },
      {
        queryKey: adminKeys.flaggedMessages(),
        queryFn: () => apiServices.admin.getFlaggedMessages({ page: 1, limit: 1 }),
        staleTime: 60_000,
      },
    ],
  });

  const metrics = useMemo(
    () => ({
      contact: totalFromList(results[0].data),
      requests: metricFromStats(results[1].data),
      quotes: metricFromStats(results[2].data),
      projects: metricFromStats(results[3].data),
      payments: totalFromList(results[4].data),
      users: totalFromList(results[5].data),
      moderation: totalFromList(results[6].data),
    }),
    [results]
  );

  return (
    <div className="space-y-6">
      <PipelineHubTabs />

      <GePageHeader
        pretitle="Operations"
        title="Pipelines"
        description="Stage pipeline for platform-wide triage. Use User hub or Project hub to drill into one client or one engagement."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pipeline/users">User hub</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pipeline/projects">Project hub</Link>
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {ADMIN_PIPELINES.map((pipeline) => (
          <PipelineSection key={pipeline.id} pipeline={pipeline} metrics={metrics} />
        ))}
      </div>

      <GeCard flush>
        <GeCardHeader
          title="Standalone consoles"
          subtitle="Independent tools — not sequential pipeline stages"
        />
        <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_STANDALONE_MODULES.map((mod) => (
            <Link
              key={mod.id}
              href={mod.href}
              className="rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm transition-colors hover:border-[var(--ge-primary)]"
            >
              <p className="font-medium text-foreground">{mod.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{mod.description}</p>
            </Link>
          ))}
        </div>
      </GeCard>

      <EndpointReference />
    </div>
  );
}
