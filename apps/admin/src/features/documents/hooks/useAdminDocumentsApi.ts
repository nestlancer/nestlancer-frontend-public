'use client';

import { useQuery } from '@tanstack/react-query';
import { apiServices } from '@/lib/axios';
import { adminKeys } from '@/lib/admin-query-keys';

export function useAdminQuoteDocumentVersionsQuery(quoteId: string, enabled = true) {
  return useQuery({
    queryKey: [...adminKeys.quote(quoteId), 'documentVersions'],
    queryFn: () => apiServices.documents.listAdminQuoteVersions(quoteId),
    enabled: Boolean(quoteId) && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useAdminPaymentDocumentVersionsQuery(paymentId: string, enabled = true) {
  return useQuery({
    queryKey: [...adminKeys.payments(), 'documentVersions', paymentId],
    queryFn: () => apiServices.documents.listAdminPaymentVersions(paymentId),
    enabled: Boolean(paymentId) && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
