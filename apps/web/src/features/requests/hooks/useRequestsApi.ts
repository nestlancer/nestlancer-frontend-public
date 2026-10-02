'use client';

import {
  asPaginated,
  peelSuccessEnvelope,
  requestsRequestsControllerGetAttachmentDownloadUrl,
  useRequestsRequestsControllerAddAttachment,
  useRequestsRequestsControllerCreateRequest,
  useRequestsRequestsControllerDeleteRequest,
  useRequestsRequestsControllerGetRequestDetails,
  useRequestsRequestsControllerGetRequestQuotes,
  useRequestsRequestsControllerGetStats,
  useRequestsRequestsControllerGetStatusTimeline,
  useRequestsRequestsControllerListRequests,
  useRequestsRequestsControllerRemoveAttachment,
  useRequestsRequestsControllerSubmitRequest,
  useRequestsRequestsControllerUpdateRequest,
} from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type {
  CreateRequestPayload,
  PaginatedResponse,
  ProjectRequestSummary,
  RequestDetail,
  UserRequestStats,
} from '@nestlancer/types';

export function useRequestsListQuery(params: {
  page: number;
  limit: number;
  status?: string;
  q?: string;
  enabled?: boolean;
}) {
  const { page, limit, status, q, enabled = true } = params;
  return useRequestsRequestsControllerListRequests<PaginatedResponse<ProjectRequestSummary>>(
    {
      page: String(page),
      limit: String(limit),
      status: status ?? '',
      ...(q?.trim() ? { q: q.trim() } : {}),
    } as Parameters<typeof useRequestsRequestsControllerListRequests>[0],
    {
      query: {
        enabled,
        queryKey: [...queryKeys.requests.list(), page, status ?? '', q ?? ''],
        select: (data) => asPaginated<ProjectRequestSummary>(data),
      },
    }
  );
}

export function useRequestsStatsQuery() {
  return useRequestsRequestsControllerGetStats({
    query: {
      queryKey: [...queryKeys.requests.list(), 'stats'],
      select: (data) => data as unknown as UserRequestStats,
    },
  });
}

export function useRequestDetailQuery(id: string) {
  return useRequestsRequestsControllerGetRequestDetails(id, {
    query: {
      queryKey: queryKeys.requests.detail(id),
      select: (data) => data as unknown as RequestDetail,
    },
  });
}

export function useRequestQuotesQuery(id: string, enabled: boolean) {
  return useRequestsRequestsControllerGetRequestQuotes(id, {
    query: {
      enabled,
      queryKey: queryKeys.requests.quotes(id),
      select: (data) => {
        const peeled = peelSuccessEnvelope(data) as { requestId?: string; quotes?: unknown[] };
        return {
          requestId: String(peeled.requestId ?? id),
          quotes: Array.isArray(peeled.quotes) ? peeled.quotes : [],
        };
      },
    },
  });
}

export function useRequestStatusTimelineQuery(id: string, enabled: boolean) {
  return useRequestsRequestsControllerGetStatusTimeline(id, {
    query: {
      enabled,
      queryKey: [...queryKeys.requests.detail(id), 'status'],
      select: (data) => {
        const inner = peelSuccessEnvelope(data) as
          | unknown[]
          | { statusHistory?: unknown[] }
          | null
          | undefined;
        if (Array.isArray(inner)) return inner;
        if (inner && typeof inner === 'object' && Array.isArray(inner.statusHistory)) {
          return inner.statusHistory;
        }
        return [];
      },
    },
  });
}

export {
  useRequestsRequestsControllerCreateRequest as useCreateRequestMutation,
  useRequestsRequestsControllerSubmitRequest as useSubmitRequestMutation,
  useRequestsRequestsControllerDeleteRequest as useDeleteRequestMutation,
  useRequestsRequestsControllerUpdateRequest as useUpdateRequestMutation,
  useRequestsRequestsControllerAddAttachment as useAddRequestAttachmentMutation,
  useRequestsRequestsControllerRemoveAttachment as useRemoveRequestAttachmentMutation,
};

export { requestsRequestsControllerGetAttachmentDownloadUrl };

export type { CreateRequestPayload };
