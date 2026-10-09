'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Download, ExternalLink } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, type InvoiceSummary } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonTable,
  StatusBadge,
} from '@nestlancer/ui';
import { formatMoneyFromPaise, openSafeHttpUrl } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';
import { useInvoicesListQuery } from '@/features/invoices/hooks/useInvoicesApi';
import { ClientListPage } from '@/components/web/ClientListPage';
import { WebPanel } from '@/components/web/WebPanel';
import {
  formatPaymentStatusLabel,
  paymentStatusBadgeVariant,
} from '@/features/payments/payment-status-utils';

function invoiceLabel(row: InvoiceSummary): string {
  // Prefer registry/canonical NL-INV-* so the UI matches verify-document + PDF header.
  return row.documentNumber || row.invoiceNumber || row.id.slice(0, 8);
}

/** Invoice archive vocabulary — Issued when paid, Pending when due, else payment label. */
function formatInvoiceStatusLabel(status: string | undefined, canPay?: boolean): string {
  const s = String(status || '').toLowerCase();
  if (s.includes('complete') || s.includes('paid')) return 'Issued';
  if (s.includes('refund')) return 'Refunded';
  if (canPay === false && (s === 'created' || s === 'pending')) return 'Draft';
  if (s === 'created') return 'Pending';
  return formatPaymentStatusLabel(String(status || 'issued'), { canPay });
}

export function InvoicesListClient() {
  const { data, isPending, isError, error, refetch } = useInvoicesListQuery();

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  async function downloadInvoice(id: string) {
    try {
      const url = await apiServices.invoices.getDownloadUrl(id);
      if (url) openSafeHttpUrl(url);
      else toast.message('Invoice PDF not available yet');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not download invoice'));
    }
  }

  return (
    <ClientListPage>
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        description="Your issued invoices with downloadable PDF copies for accounting and tax records."
        actions={
          <Button variant="outline" className="rounded-lg font-semibold" asChild>
            <Link href={routes.payments}>View payments</Link>
          </Button>
        }
      />

      <WebPanel padding="none">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 md:px-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Invoice archive
          </h2>
        </div>
        {isPending ? <SkeletonTable rows={6} cols={5} className="p-4" /> : null}
        {isError ? (
          <div className="p-6">
            <ErrorState
              title="Could not load invoices"
              message={getApiErrorMessage(error, 'Could not load invoices')}
              onRetry={() => void refetch()}
            />
          </div>
        ) : null}
        {!isPending && !isError && items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No invoices yet"
              description="Invoices appear when a milestone payment is due or completed."
            />
          </div>
        ) : null}
        {!isPending && !isError && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Project
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const status = String(row.status || '');
                  const canPay = row.canPay;
                  const canDownload =
                    canPay === true ||
                    ['completed', 'paid', 'refunded', 'processing', 'pending_verification'].some(
                      (s) => status.toLowerCase().includes(s)
                    );
                  const paymentHref = row.paymentId || row.id;

                  return (
                    <tr key={row.id} className="border-b border-border/50">
                      <td className="px-4 py-3 font-medium">{invoiceLabel(row)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.projectTitle ??
                          (row as InvoiceSummary & { project?: { title?: string } }).project
                            ?.title ??
                          '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {typeof row.amount === 'number'
                          ? formatMoneyFromPaise(row.amount, row.currency ?? 'INR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          variant={paymentStatusBadgeVariant(status, { canPay })}
                          className="capitalize"
                        >
                          {formatInvoiceStatusLabel(status, canPay)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canDownload ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`Download invoice ${invoiceLabel(row)}`}
                              onClick={() => void downloadInvoice(row.id)}
                            >
                              <Download className="h-4 w-4" aria-hidden />
                              Download invoice
                            </Button>
                          ) : null}
                          <Button type="button" variant="ghost" size="sm" asChild>
                            <Link href={routes.payment(paymentHref)}>
                              <ExternalLink className="h-4 w-4" aria-hidden />
                              View
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </WebPanel>
    </ClientListPage>
  );
}
