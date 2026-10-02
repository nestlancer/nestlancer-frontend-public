'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nestlancer/constants';
import { apiServices } from '@/lib/axios';

export function useQuoteDocumentVersionsQuery(quoteId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.quotes.documentVersions(quoteId),
    queryFn: () => apiServices.documents.listQuoteVersions(quoteId),
    enabled: Boolean(quoteId) && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function usePaymentDocumentVersionsQuery(paymentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.payments.documentVersions(paymentId),
    queryFn: () => apiServices.documents.listPaymentVersions(paymentId),
    enabled: Boolean(paymentId) && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useDocumentVerifyQuery(documentNumber: string, token?: string, enabled = true) {
  const trimmed = documentNumber.trim();
  const trimmedToken = token?.trim() ?? '';
  return useQuery({
    queryKey: queryKeys.documents.verify(trimmed, trimmedToken || undefined),
    queryFn: () => apiServices.documents.verify(trimmed, trimmedToken || undefined),
    // Public verify requires HMAC `t` after E-10; number-only always 404s.
    enabled: Boolean(trimmed) && Boolean(trimmedToken) && enabled,
    retry: false,
  });
}
