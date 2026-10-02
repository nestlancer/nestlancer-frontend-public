'use client';

import type { Project } from '@nestlancer/types';
import { Calendar, Target, Wallet } from '@nestlancer/ui/icons';

import { DomainStatusBadge, PctProgressFill, StatusBadge } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { WebPanel } from '@/components/web/WebPanel';
import { asRecord } from '@/lib/client-api-view';

function formatDate(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function ProjectHubHeader({
  project,
  percentComplete,
  milestonesCompleted,
  milestonesTotal,
  budgetPaise,
  currency,
}: {
  project: Project;
  percentComplete: number | null;
  milestonesCompleted: number;
  milestonesTotal: number;
  budgetPaise?: number;
  currency?: string;
}) {
  const extra = asRecord(project as unknown);
  const startDate = formatDate(extra?.startDate != null ? String(extra.startDate) : undefined);
  const endDate = formatDate(extra?.endDate != null ? String(extra.endDate) : undefined);
  const pct =
    percentComplete != null
      ? Math.round(percentComplete)
      : milestonesTotal > 0
        ? Math.round((milestonesCompleted / milestonesTotal) * 100)
        : null;

  return (
    <header className="space-y-6 animate-fade-in motion-reduce:animate-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[1.625rem]">
            {project.title}
          </h1>
          {project.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DomainStatusBadge domain="project" status={String(project.status ?? '')} />
          {pct != null ? <StatusBadge variant="purple">{pct}% complete</StatusBadge> : null}
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {budgetPaise != null && budgetPaise > 0 ? (
          <WebPanel padding="sm">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" aria-hidden />
              Budget
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {formatMoneyFromPaise(budgetPaise, currency ?? 'INR')}
            </dd>
          </WebPanel>
        ) : null}
        {startDate ? (
          <WebPanel padding="sm">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Start date
            </dt>
            <dd className="mt-1 text-sm font-semibold">{startDate}</dd>
          </WebPanel>
        ) : null}
        {endDate ? (
          <WebPanel padding="sm">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Deadline
            </dt>
            <dd className="mt-1 text-sm font-semibold">{endDate}</dd>
          </WebPanel>
        ) : null}
        {milestonesTotal > 0 ? (
          <WebPanel padding="sm">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5" aria-hidden />
              Delivery milestones
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {milestonesCompleted}/{milestonesTotal} completed
            </dd>
          </WebPanel>
        ) : null}
      </dl>

      {pct != null ? (
        <div>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span>{pct}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <PctProgressFill pct={pct} fillClassName="fill-ta-brand-500" className="h-full" />
          </div>
        </div>
      ) : null}
    </header>
  );
}
