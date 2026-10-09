'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Receipt } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { useQuotesListQuery, useQuotesStatsQuery } from '@/features/quotes/hooks/useQuotesApi';
import type { Quote } from '@nestlancer/types';
import {
  cn,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SkeletonTable,
  StatusBadge,
  Button,
} from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { formatWorkStatusLabel, workStatusBadgeVariant } from '@/features/work/status-utils';
import { WorkListShell } from '@/features/work/WorkListItem';
import { ClientFilterBar } from '@/components/web/ClientFilterBar';
import { ClientListPage } from '@/components/web/ClientListPage';
import { webMetricStripClass, webPrimaryButtonClass } from '@/lib/tailadmin-classes';

const PAGE_SIZE = 12;

const QUOTE_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'sent', label: 'Awaiting response' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'changesRequested', label: 'Changes requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

function QuotesStatBar({ stats }: { stats: Record<string, unknown> | undefined }) {
  if (!stats) return null;
  const byStatus =
    stats.byStatus && typeof stats.byStatus === 'object' && !Array.isArray(stats.byStatus)
      ? (stats.byStatus as Record<string, unknown>)
      : {};
  const statusCount = (...keys: string[]) =>
    keys.reduce((sum, key) => sum + Number(byStatus[key] ?? stats[key] ?? 0), 0);
  // API returns camelCase under byStatus; "pending" UX = awaiting response (sent + viewed).
  const pending = statusCount('pending', 'sent', 'viewed');
  const accepted = statusCount('accepted', 'converted');
  const declined = statusCount('declined');
  const tiles = [
    { label: 'Total', value: Number(stats.total ?? 0) },
    { label: 'Pending', value: pending },
    { label: 'Accepted', value: accepted },
    { label: 'Declined', value: declined },
  ];
  return (
    <div className={cn(webMetricStripClass, 'sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4')}>
      {tiles.map((t) => (
        <div key={t.label} className="px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{t.label}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white/90">
            {t.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function QuotesListClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const statusFilter = searchParams.get('status') ?? '';

  const setStatusFilter = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('status', next);
      else params.delete('status');
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete('page');
    else params.set('page', String(next));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const { data, isPending, isError, error, refetch } = useQuotesListQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter || undefined,
  });

  const statsQ = useQuotesStatsQuery();

  const items: Quote[] = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <ClientListPage>
      <PageHeader
        title="Quotes"
        description="Review platform quotes from the Nestlancer team, accept when ready, or request changes."
      />
      <QuotesStatBar stats={statsQ.data} />

      <WorkListShell>
        <div className="border-b border-border/60 p-3">
          <ClientFilterBar
            className="border-0 bg-transparent p-0 shadow-none dark:bg-transparent"
            filters={[
              {
                id: 'quote-status',
                label: 'Filter quotes by status',
                value: statusFilter,
                options: QUOTE_STATUS_OPTIONS,
                onChange: setStatusFilter,
              },
            ]}
          />
        </div>

        {isError ? (
          <div className="p-4">
            <ErrorState
              title="Could not load quotes"
              message={getApiErrorMessage(error, 'Could not load quotes')}
              onRetry={() => void refetch()}
            />
          </div>
        ) : null}
        {isPending ? (
          <div className="p-4">
            <SkeletonTable rows={6} cols={3} />
          </div>
        ) : null}
        {!isPending && !isError && items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No quotes yet"
              description="When the Nestlancer team sends a quote for your request, it will show up here with amount, status, and a link to review."
              action={
                <Button className={webPrimaryButtonClass} asChild>
                  <Link href={routes.requests}>Browse requests</Link>
                </Button>
              }
            />
          </div>
        ) : null}
        {!isPending && !isError
          ? items.map((q) => {
              const amount = typeof q.totalAmount === 'number' ? q.totalAmount : q.amount;
              const heading =
                (typeof q.requestTitle === 'string' && q.requestTitle.trim()) ||
                (typeof q.title === 'string' && q.title.trim()) ||
                '';
              const statusLabel = formatWorkStatusLabel(String(q.status));
              const formatted =
                typeof amount === 'number'
                  ? formatMoneyFromPaise(amount, q.currency ?? 'INR', 'en-IN')
                  : `— ${q.currency ?? ''}`;
              const dateLabel = q.createdAt
                ? new Date(q.createdAt).toLocaleString(undefined, { dateStyle: 'medium' })
                : '—';
              const ariaLabel = [heading || 'Quote', statusLabel, formatted, dateLabel]
                .filter(Boolean)
                .join(' · ');

              return (
                <Link
                  key={q.id}
                  href={routes.quote(q.id)}
                  aria-label={ariaLabel}
                  className={cn(
                    'flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3 transition-theme last:border-b-0',
                    'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Receipt className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {heading || 'Untitled request'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{dateLabel}</p>
                  </div>
                  <StatusBadge
                    variant={workStatusBadgeVariant(String(q.status))}
                    dot
                    className="shrink-0 capitalize"
                  >
                    {statusLabel}
                  </StatusBadge>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatted}
                  </p>
                </Link>
              );
            })
          : null}
      </WorkListShell>

      {!isPending && !isError && total > 0 ? (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      ) : null}
    </ClientListPage>
  );
}
