'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useState } from 'react';
import { toast } from '@nestlancer/ui';
import { getApiErrorMessage } from '@nestlancer/api-client';

import { apiServices } from '@/lib/axios';
import {
  DocumentVersionsPanel,
  type DocumentLatestAction,
} from '@/features/documents/components/DocumentVersionsPanel';

export function LiveQuoteDocumentsPanel({
  quoteId,
  showContractAction = false,
  showContractPreview = false,
  enabled = true,
}: {
  quoteId: string;
  showContractAction?: boolean;
  showContractPreview?: boolean;
  enabled?: boolean;
}) {
  const [quotePending, setQuotePending] = useState(false);
  const [contractPending, setContractPending] = useState(false);
  const [previewPending, setPreviewPending] = useState(false);

  if (!enabled) return null;

  async function downloadLatestQuote() {
    setQuotePending(true);
    try {
      const meta = await apiServices.quotes.getPdfDownloadUrl(quoteId);
      if (meta?.downloadUrl) {
        openSafeHttpUrl(meta.downloadUrl);
        return;
      }
      toast.message('Quote PDF not available yet');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Quote PDF download failed'));
    } finally {
      setQuotePending(false);
    }
  }

  async function downloadLatestContract() {
    setContractPending(true);
    try {
      const url = await apiServices.documents.getQuoteContractUrl(quoteId);
      if (url) {
        openSafeHttpUrl(url);
        return;
      }
      toast.message('Signed contract not available yet');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Contract download failed'));
    } finally {
      setContractPending(false);
    }
  }

  async function previewContract() {
    setPreviewPending(true);
    try {
      const url = await apiServices.documents.getQuoteContractPreviewUrl(quoteId);
      if (url) {
        openSafeHttpUrl(url);
        return;
      }
      toast.message('Contract preview not available');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Contract preview failed'));
    } finally {
      setPreviewPending(false);
    }
  }

  const latestActions: DocumentLatestAction[] = [
    {
      key: 'quote-latest',
      label: 'Download quote PDF',
      onClick: downloadLatestQuote,
      isPending: quotePending,
    },
  ];

  if (showContractPreview) {
    latestActions.push({
      key: 'contract-preview',
      label: 'Preview service agreement (draft)',
      onClick: previewContract,
      isPending: previewPending,
    });
  }

  if (showContractAction) {
    latestActions.push({
      key: 'contract-latest',
      label: 'Download signed service agreement',
      onClick: downloadLatestContract,
      isPending: contractPending,
    });
  }

  return (
    <DocumentVersionsPanel
      title="Documents"
      description="Download the latest quote PDF and service agreement."
      versions={[]}
      latestActions={latestActions}
      showVersionHistory={false}
    />
  );
}
