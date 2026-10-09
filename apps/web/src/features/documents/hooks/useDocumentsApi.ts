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

/** FNV-1a fingerprint so verify cache keys bust on token change without storing the secret. */
function tokenFingerprint(token: string): string {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function useDocumentVerifyQuery(documentNumber: string, token?: string, enabled = true) {
  const trimmed = documentNumber.trim();
  const trimmedToken = token?.trim() ?? '';
  return useQuery({
    queryKey: queryKeys.documents.verify(
      trimmed,
      trimmedToken ? tokenFingerprint(trimmedToken) : ''
    ),
    queryFn: () => apiServices.documents.verify(trimmed, trimmedToken || undefined),
    // Public verify requires HMAC `t` after E-10; number-only always 404s.
    enabled: Boolean(trimmed) && Boolean(trimmedToken) && enabled,
    retry: false,
  });
}
