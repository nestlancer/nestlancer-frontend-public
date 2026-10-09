'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import {
  asPaginated,
  peelSuccessEnvelope,
  unwrapGatewayBody,
  useQuotesQuotesControllerGetQuoteDetails,
  useQuotesQuotesControllerGetStats,
  useQuotesQuotesControllerListQuotes,
  useQuotesQuotesControllerRequestChanges,
  quotesQuotesControllerDownloadPdf,
} from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { PaginatedResponse, Quote } from '@nestlancer/types';

import { apiServices } from '@/lib/axios';

export function useQuotesListQuery(params: {
  page: number;
  limit: number;
  status?: string;
  enabled?: boolean;
}) {
  const { page, limit, status, enabled = true } = params;
  return useQuotesQuotesControllerListQuotes<PaginatedResponse<Quote>>(
    {
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
    } as Parameters<typeof useQuotesQuotesControllerListQuotes>[0],
    {
      query: {
        enabled,
        queryKey: [...queryKeys.quotes.list(), page, status ?? ''],
        select: (data) => asPaginated<Quote>(data),
      },
    }
  );
}

export function useQuotesStatsQuery() {
  return useQuotesQuotesControllerGetStats({
    query: {
      queryKey: queryKeys.quotes.stats,
      select: (data) => unwrapGatewayBody<Record<string, unknown>>(data),
    },
  });
}

export function useQuoteDetailQuery(id: string) {
  return useQuotesQuotesControllerGetQuoteDetails(id, {
    query: {
      queryKey: queryKeys.quotes.detail(id),
      select: (data) => unwrapGatewayBody<Record<string, unknown>>(data),
    },
  });
}

type QuoteActionVars = { id: string; data: Record<string, unknown> };

/** NL-BV-C3-F5-01: live UI must use Idempotency-Key (handwritten QuotesService). */
export function useAcceptQuoteMutation(options?: {
  mutation?: UseMutationOptions<unknown, unknown, QuoteActionVars, unknown>;
}) {
  return useMutation({
    mutationFn: ({ id, data }: QuoteActionVars) => apiServices.quotes.accept(id, data),
    ...options?.mutation,
  });
}

/** NL-BV-C3-F5-01: live UI must use Idempotency-Key (handwritten QuotesService). */
export function useDeclineQuoteMutation(options?: {
  mutation?: UseMutationOptions<unknown, unknown, QuoteActionVars, unknown>;
}) {
  return useMutation({
    mutationFn: ({ id, data }: QuoteActionVars) => apiServices.quotes.decline(id, data),
    ...options?.mutation,
  });
}

export {
  useQuotesQuotesControllerRequestChanges as useRequestQuoteChangesMutation,
  quotesQuotesControllerDownloadPdf,
  peelSuccessEnvelope,
};
