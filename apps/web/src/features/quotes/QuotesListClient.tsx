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
  StatCard,
  StatusBadge,
  Button,
} from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { formatWorkStatusLabel, workStatusBadgeVariant } from '@/features/work/status-utils';
import { ClientFilterBar } from '@/components/web/ClientFilterBar';
import { ClientListPage } from '@/components/web/ClientListPage';
import { webListCardClass, webPrimaryButtonClass } from '@/lib/tailadmin-classes';

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tiles.map((t, i) => (
        <StatCard
          key={t.label}
          label={t.label}
          value={t.value}
          icon={<Receipt className="h-5 w-5" aria-hidden />}
          iconVariant={i === 1 ? 'warning' : i === 2 ? 'success' : 'purple'}
          stagger={(i + 1) as 1 | 2 | 3 | 4}
        />
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

      <ClientFilterBar
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

      {isError ? (
        <ErrorState
          title="Could not load quotes"
          message={getApiErrorMessage(error, 'Could not load quotes')}
          onRetry={() => void refetch()}
        />
      ) : null}
      {isPending ? <SkeletonTable rows={6} cols={3} /> : null}
      {!isPending && !isError && items.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          description="When the Nestlancer team sends a quote for your request, it will show up here with amount, status, and a link to review."
          action={
            <Button className={webPrimaryButtonClass} asChild>
              <Link href={routes.requests}>Browse requests</Link>
            </Button>
          }
        />
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((q) => {
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
            <li key={q.id}>
              <Link
                href={routes.quote(q.id)}
                aria-label={ariaLabel}
                className={cn(
                  webListCardClass,
                  'hover:border-ta-brand-500/35 hover:shadow-theme-sm active:scale-[0.99]'
                )}
              >
                <div className="relative flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ta-brand-50 text-ta-brand-600 ring-1 ring-ta-brand-500/15 dark:bg-ta-brand-500/[0.12] dark:text-ta-brand-400">
                    <Receipt className="h-5 w-5" aria-hidden />
                  </span>
                  <StatusBadge
                    variant={workStatusBadgeVariant(String(q.status))}
                    dot
                    className="capitalize"
                  >
                    {statusLabel}
                  </StatusBadge>
                </div>
                <h2 className="mt-3 line-clamp-2 text-sm font-medium text-foreground">
                  {heading || 'Untitled request'}
                </h2>
                <p className="mt-4 font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {formatted}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{dateLabel}</p>
                <span className="mt-4 inline-flex text-xs font-semibold text-ta-brand-500 opacity-0 transition-opacity group-hover:opacity-100">
                  Review quote →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {!isPending && !isError && total > 0 ? (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      ) : null}
    </ClientListPage>
  );
}
