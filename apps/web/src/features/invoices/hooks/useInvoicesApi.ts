'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nestlancer/constants';
import { apiServices } from '@/lib/axios';

export function useInvoicesListQuery(params?: {
  page?: number;
  limit?: number;
  status?: string;
  enabled?: boolean;
}) {
  const { page = 1, limit = 20, status, enabled = true } = params ?? {};
  return useQuery({
    queryKey: queryKeys.invoices.list({ page, status }),
    queryFn: () => apiServices.invoices.list({ page, limit, status }),
    enabled,
  });
}

export function useInvoiceDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => apiServices.invoices.getById(id),
    enabled: Boolean(id),
  });
}
