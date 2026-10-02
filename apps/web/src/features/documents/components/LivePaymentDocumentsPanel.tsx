'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useEffect, useState } from 'react';
import { toast } from '@nestlancer/ui';
import { getApiErrorMessage } from '@nestlancer/api-client';

import { apiServices } from '@/lib/axios';
import {
  DocumentVersionsPanel,
  type DocumentLatestAction,
} from '@/features/documents/components/DocumentVersionsPanel';

export function LivePaymentDocumentsPanel({
  paymentId,
  enabled = true,
  showInvoice = true,
  showReceipt = true,
  /** When payment is COMPLETED but invoiceNumber is still null (async worker lag). */
  invoiceGenerating = false,
}: {
  paymentId: string;
  enabled?: boolean;
  showInvoice?: boolean;
  showReceipt?: boolean;
  invoiceGenerating?: boolean;
}) {
  const [receiptPending, setReceiptPending] = useState(false);
  const [invoicePending, setInvoicePending] = useState(false);
  const [stillGenerating, setStillGenerating] = useState(invoiceGenerating);

  useEffect(() => {
    setStillGenerating(invoiceGenerating);
  }, [invoiceGenerating]);

  // Poll briefly while the document worker assigns an invoice number (audit: 2–3 min lag).
  useEffect(() => {
    if (!enabled || !showInvoice || !stillGenerating) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const url = await apiServices.payments.getInvoiceUrl(paymentId);
        if (!cancelled && url) {
          setStillGenerating(false);
        }
      } catch {
        /* keep generating state */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, showInvoice, stillGenerating, paymentId]);

  if (!enabled) return null;

  async function downloadLatestReceipt() {
    setReceiptPending(true);
    try {
      const url = await apiServices.payments.getReceiptUrl(paymentId);
      if (url) {
        openSafeHttpUrl(url);
        return;
      }
      toast.message('Receipt not available yet');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Receipt download failed'));
    } finally {
      setReceiptPending(false);
    }
  }

  async function downloadLatestInvoice() {
    setInvoicePending(true);
    try {
      const url = await apiServices.payments.getInvoiceUrl(paymentId);
      if (url) {
        setStillGenerating(false);
        openSafeHttpUrl(url);
        return;
      }
      toast.message(
        stillGenerating
          ? 'Invoice is still generating — try again shortly'
          : 'Invoice not available yet'
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Invoice download failed'));
    } finally {
      setInvoicePending(false);
    }
  }

  const latestActions: DocumentLatestAction[] = [
    ...(showInvoice
      ? [
          {
            key: 'invoice-latest',
            label: stillGenerating ? 'Generating invoice…' : 'Download invoice',
            hint: stillGenerating
              ? 'Invoice number is assigned asynchronously after payment completes.'
              : undefined,
            onClick: downloadLatestInvoice,
            isPending: invoicePending,
            disabled: stillGenerating || invoicePending,
          } satisfies DocumentLatestAction,
        ]
      : []),
    ...(showReceipt
      ? [
          {
            key: 'receipt-latest',
            label: 'Download receipt',
            onClick: downloadLatestReceipt,
            isPending: receiptPending,
          } satisfies DocumentLatestAction,
        ]
      : []),
  ];

  if (latestActions.length === 0) return null;

  return (
    <DocumentVersionsPanel
      title="Billing documents"
      description={
        stillGenerating
          ? 'Your invoice is being generated. This usually finishes within a few minutes.'
          : 'Download the latest invoice or receipt for this payment.'
      }
      versions={[]}
      latestActions={latestActions}
      showVersionHistory={false}
    />
  );
}
