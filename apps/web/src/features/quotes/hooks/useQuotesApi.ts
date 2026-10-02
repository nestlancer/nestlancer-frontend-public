'use client';

import {
  asPaginated,
  peelSuccessEnvelope,
  unwrapGatewayBody,
  useQuotesQuotesControllerAcceptQuote,
  useQuotesQuotesControllerDeclineQuote,
  useQuotesQuotesControllerGetQuoteDetails,
  useQuotesQuotesControllerGetStats,
  useQuotesQuotesControllerListQuotes,
  useQuotesQuotesControllerRequestChanges,
  quotesQuotesControllerDownloadPdf,
} from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { PaginatedResponse, Quote } from '@nestlancer/types';

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

export {
  useQuotesQuotesControllerAcceptQuote as useAcceptQuoteMutation,
  useQuotesQuotesControllerDeclineQuote as useDeclineQuoteMutation,
  useQuotesQuotesControllerRequestChanges as useRequestQuoteChangesMutation,
  quotesQuotesControllerDownloadPdf,
  peelSuccessEnvelope,
};
