'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import {
  extractDocumentApiFailure,
  extractDocumentUrl,
  getApiErrorMessage,
} from '@nestlancer/api-client';

import { apiServices } from '@/lib/axios';
import { adminKeys } from '@/lib/admin-query-keys';
import { useAdminPaymentDocumentVersionsQuery } from '@/features/documents/hooks/useAdminDocumentsApi';
import {
  DocumentVersionsPanel,
  type DocumentLatestAction,
} from '@/features/documents/components/DocumentVersionsPanel';

function openDocumentUrl(raw: unknown, fallbackMessage: string) {
  const failure = extractDocumentApiFailure(raw);
  if (failure) {
    toast.error(failure);
    return false;
  }
  const url = extractDocumentUrl(raw);
  if (url) {
    openSafeHttpUrl(url);
    return true;
  }
  toast.message(fallbackMessage);
  return false;
}

export function LiveAdminPaymentDocumentsPanel({
  paymentId,
  enabled = true,
}: {
  paymentId: string;
  enabled?: boolean;
}) {
  const qc = useQueryClient();
  const [receiptPending, setReceiptPending] = useState(false);
  const [invoicePending, setInvoicePending] = useState(false);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);

  const versionsQ = useAdminPaymentDocumentVersionsQuery(paymentId, enabled);

  async function downloadVersion(row: {
    id: string;
    documentNumber: string;
    versionNumber: number;
  }) {
    setDownloadingVersionId(row.id);
    try {
      const url = await apiServices.documents.getAdminDocumentDownloadUrl(row.id);
      if (url) {
        openSafeHttpUrl(url);
        return;
      }
      toast.error('Could not get download link for this version');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not download this document version'));
    } finally {
      setDownloadingVersionId(null);
    }
  }

  async function refreshVersions() {
    await qc.invalidateQueries({
      queryKey: [...adminKeys.payments(), 'documentVersions', paymentId],
    });
    await versionsQ.refetch();
  }

  async function downloadLatestReceipt() {
    setReceiptPending(true);
    try {
      const raw = await apiServices.admin.getAdminPaymentReceipt(paymentId);
      if (openDocumentUrl(raw, 'Receipt not available yet')) {
        await refreshVersions();
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not download receipt'));
    } finally {
      setReceiptPending(false);
    }
  }

  async function downloadLatestInvoice() {
    setInvoicePending(true);
    try {
      const raw = await apiServices.admin.getAdminPaymentInvoice(paymentId);
      if (openDocumentUrl(raw, 'Invoice not available yet')) {
        await refreshVersions();
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not download invoice'));
    } finally {
      setInvoicePending(false);
    }
  }

  const latestActions: DocumentLatestAction[] = [
    {
      key: 'invoice-latest',
      label: 'Download latest invoice',
      onClick: downloadLatestInvoice,
      isPending: invoicePending,
    },
    {
      key: 'receipt-latest',
      label: 'Download latest receipt',
      onClick: downloadLatestReceipt,
      isPending: receiptPending,
    },
  ];

  return (
    <DocumentVersionsPanel
      title="Payment documents & versions"
      description="Live invoice and receipt history. Each regeneration keeps prior versions in cloud storage."
      versions={versionsQ.data ?? []}
      isPending={versionsQ.isPending}
      isFetching={versionsQ.isFetching}
      isError={versionsQ.isError}
      errorMessage={getApiErrorMessage(versionsQ.error, 'Could not load document versions')}
      onRefresh={() => void refreshVersions()}
      latestActions={latestActions}
      emptyDescription="Invoices and receipts appear once this payment is requested or completed."
      showVersionHistory
      onDownloadVersion={downloadVersion}
      downloadingVersionId={downloadingVersionId}
    />
  );
}
