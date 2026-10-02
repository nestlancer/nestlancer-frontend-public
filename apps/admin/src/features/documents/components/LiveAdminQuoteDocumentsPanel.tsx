'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { extractDocumentUrl, getApiErrorMessage } from '@nestlancer/api-client';

import { apiServices } from '@/lib/axios';
import { adminKeys } from '@/lib/admin-query-keys';
import { useAdminQuoteDocumentVersionsQuery } from '@/features/documents/hooks/useAdminDocumentsApi';
import {
  DocumentVersionsPanel,
  type DocumentLatestAction,
} from '@/features/documents/components/DocumentVersionsPanel';

function openDocumentUrl(raw: unknown, fallbackMessage: string) {
  const url = extractDocumentUrl(raw);
  if (url) {
    openSafeHttpUrl(url);
    return true;
  }
  toast.message(fallbackMessage);
  return false;
}

export function LiveAdminQuoteDocumentsPanel({
  quoteId,
  enabled = true,
}: {
  quoteId: string;
  enabled?: boolean;
}) {
  const qc = useQueryClient();
  const [pdfPending, setPdfPending] = useState(false);
  const [contractPending, setContractPending] = useState(false);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);

  const versionsQ = useAdminQuoteDocumentVersionsQuery(quoteId, enabled);

  async function downloadVersion(row: { id: string }) {
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
    await qc.invalidateQueries({ queryKey: [...adminKeys.quote(quoteId), 'documentVersions'] });
    await versionsQ.refetch();
  }

  async function downloadLatestQuote() {
    setPdfPending(true);
    try {
      const raw = await apiServices.admin.getAdminQuotePdf(quoteId);
      if (openDocumentUrl(raw, 'Quote PDF not available yet')) {
        await refreshVersions();
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not download quote PDF'));
    } finally {
      setPdfPending(false);
    }
  }

  async function downloadLatestContract() {
    setContractPending(true);
    try {
      const raw = await apiServices.admin.getAdminQuoteContract(quoteId);
      if (openDocumentUrl(raw, 'Signed contract not available yet')) {
        await refreshVersions();
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not download contract PDF'));
    } finally {
      setContractPending(false);
    }
  }

  const latestActions: DocumentLatestAction[] = [
    {
      key: 'quote-latest',
      label: 'Generate & download latest quote PDF',
      onClick: downloadLatestQuote,
      isPending: pdfPending,
    },
    {
      key: 'contract-latest',
      label: 'Download signed service agreement',
      onClick: downloadLatestContract,
      isPending: contractPending,
    },
  ];

  return (
    <DocumentVersionsPanel
      title="Quote documents & versions"
      description="Live version history from cloud storage. Quote and signed service agreement PDFs are listed below."
      versions={versionsQ.data ?? []}
      isPending={versionsQ.isPending}
      isFetching={versionsQ.isFetching}
      isError={versionsQ.isError}
      errorMessage={getApiErrorMessage(versionsQ.error, 'Could not load document versions')}
      onRefresh={() => void refreshVersions()}
      latestActions={latestActions}
      emptyDescription="Quote and service agreement PDF versions appear after the quote is sent or accepted."
      showVersionHistory
      onDownloadVersion={downloadVersion}
      downloadingVersionId={downloadingVersionId}
    />
  );
}
