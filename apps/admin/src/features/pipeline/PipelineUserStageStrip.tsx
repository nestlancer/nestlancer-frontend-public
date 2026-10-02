'use client';

import Link from 'next/link';

import { ChevronRight } from '@nestlancer/ui/icons';

import type { AdminPipeline } from '@/lib/admin-pipelines';

type StageMetric = Record<string, string | undefined>;

function UserPipelineStageCard({
  stage,
  metric,
  isLast,
  hrefOverride,
}: {
  stage: AdminPipeline['stages'][number];
  metric?: string;
  isLast: boolean;
  hrefOverride?: string;
}) {
  const Icon = stage.icon;
  const href = hrefOverride ?? stage.href;

  return (
    <>
      <Link
        href={href}
        className="group flex min-w-[130px] flex-1 flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-[var(--ge-primary)] hover:shadow-md"
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

export function PipelineUserStageStrip({
  pipeline,
  metrics,
  projectHubHref,
}: {
  pipeline: AdminPipeline;
  metrics: StageMetric;
  /** When set, projects stage links to project hub for selected user */
  projectHubHref?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-stretch sm:overflow-x-auto">
      {pipeline.stages.map((stage, i) => {
        const hrefOverride = stage.id === 'projects' && projectHubHref ? projectHubHref : undefined;
        return (
          <UserPipelineStageCard
            key={stage.id}
            stage={stage}
            metric={metrics[stage.id]}
            isLast={i === pipeline.stages.length - 1}
            hrefOverride={hrefOverride}
          />
        );
      })}
    </div>
  );
}
