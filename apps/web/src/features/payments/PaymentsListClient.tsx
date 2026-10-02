'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { Plus } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { usePaymentsListQuery } from '@/features/payments/hooks/usePaymentsApi';
import type { Payment } from '@nestlancer/types';
import {
  Button,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  SkeletonTable,
  StatusBadge,
} from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import {
  formatPaymentStatusLabel,
  paymentStatusBadgeVariant,
  isPaymentCheckoutVisible,
} from './payment-status-utils';
import { PaymentStatsHero } from './components/PaymentStatsHero';
import { PaymentTrustStrip } from './components/PaymentTrustStrip';
import { ClientListPage } from '@/components/web/ClientListPage';
import { WebPanel } from '@/components/web/WebPanel';
import { paymentsDebug, paymentsDebugError } from './payments-debug';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'NOT_DUE', label: 'Not due yet' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export function PaymentsListClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') ?? '';

  const setStatusFilter = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('status', next);
      else params.delete('status');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const { data, isPending, isError, error, refetch } = usePaymentsListQuery({
    status: statusFilter || undefined,
  });

  useEffect(() => {
    if (data) {
      paymentsDebug('list:response', {
        statusFilter: statusFilter || 'all',
        count: data?.items?.length ?? 0,
        total: data?.total,
      });
    }
  }, [data, statusFilter]);

  const items = useMemo(() => (data?.items ?? []) as Payment[], [data?.items]);

  useEffect(() => {
    if (isError) {
      paymentsDebugError('list:error', error, { statusFilter: statusFilter || 'all' });
    }
  }, [isError, error, statusFilter]);

  useEffect(() => {
    paymentsDebug('list:render', {
      statusFilter: statusFilter || 'all',
      itemCount: items.length,
    });
  }, [statusFilter, items.length]);

  return (
    <ClientListPage>
      <PageHeader
        eyebrow="Billing"
        title="Billing Center"
        description="Payment history, invoices, and milestone payment tracking."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-lg font-semibold" asChild>
              <Link href={routes.invoices}>Invoices</Link>
            </Button>
            <Button variant="outline" className="rounded-lg font-semibold" asChild>
              <Link href={routes.paymentMethods}>
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Payment methods
              </Link>
            </Button>
          </div>
        }
      />

      <PaymentStatsHero />

      <WebPanel padding="none">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:px-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Transaction history
          </h2>
        </div>
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800 md:px-5">
          <FilterBar
            filters={[
              {
                id: 'status',
                label: 'Status',
                value: statusFilter,
                options: STATUS_OPTIONS,
                onChange: setStatusFilter,
              },
            ]}
          />
        </div>

        {isError ? (
          <ErrorState
            className="m-4"
            title="Could not load payments"
            message={getApiErrorMessage(error, 'Could not load payments')}
            onRetry={() => void refetch()}
          />
        ) : null}

        {isPending ? <SkeletonTable rows={5} cols={6} className="p-4" /> : null}

        {!isPending && !isError && items.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent py-12"
            variant={statusFilter ? 'no-results' : 'no-data'}
            title={statusFilter ? 'No payments match this filter' : 'No payments yet'}
            description={
              statusFilter
                ? 'Try another status or clear the filter.'
                : 'When you pay a project milestone, your transactions and receipts will appear here.'
            }
            action={
              statusFilter ? (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('')}>
                  Clear filter
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {!isPending && !isError && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
                  <th className="px-6 py-3 font-semibold" scope="col">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Description
                  </th>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Project
                  </th>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-semibold" scope="col">
                    Amount
                  </th>
                  <th className="px-6 py-3 font-semibold" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((p) => {
                  const amount =
                    typeof p.amount === 'number'
                      ? formatMoneyFromPaise(p.amount, p.currency ?? 'INR', 'en-IN')
                      : `${p.amount} ${p.currency ?? ''}`;
                  const projectTitle = (p as Payment & { project?: { title?: string } }).project
                    ?.title;
                  const milestoneName = (p as Payment & { milestone?: { name?: string } }).milestone
                    ?.name;
                  const description = milestoneName ?? `Payment ${p.id.slice(0, 8)}`;
                  const paymentStatus = String(p.status);
                  const canPay = (p as Payment).canPay;
                  const showCheckout = isPaymentCheckoutVisible(paymentStatus, canPay);

                  return (
                    <tr
                      key={p.id}
                      className="transition-theme hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-4 font-medium text-foreground">
                        {description}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-4 text-muted-foreground">
                        {projectTitle ??
                          ((p as Payment & { projectId?: string }).projectId
                            ? `Project ${(p as Payment & { projectId: string }).projectId.slice(0, 8)}…`
                            : '—')}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          variant={paymentStatusBadgeVariant(paymentStatus, { canPay })}
                          dot={
                            showCheckout &&
                            ['pending', 'processing', 'created'].includes(
                              paymentStatus.toLowerCase()
                            )
                          }
                        >
                          {formatPaymentStatusLabel(paymentStatus, { canPay })}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">
                        {amount}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg" asChild>
                          <Link href={routes.payment(p.id)}>
                            {showCheckout ? 'Checkout' : 'View'}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </WebPanel>

      <PaymentTrustStrip />
    </ClientListPage>
  );
}
