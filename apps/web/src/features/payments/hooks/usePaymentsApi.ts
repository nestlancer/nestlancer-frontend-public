'use client';

import {
  asPaginated,
  usePaymentsPaymentsControllerCancelPayment,
  usePaymentsPaymentsControllerConfirmPayment,
  usePaymentsPaymentsControllerCreateIntent,
  usePaymentsPaymentsControllerFileDispute,
  usePaymentsPaymentsControllerGetMyPayments,
  usePaymentsPaymentsControllerGetPaymentDetails,
  usePaymentsPaymentsControllerGetPaymentStats,
  usePaymentsPaymentsControllerGetPaymentStatus,
  usePaymentsPaymentsControllerGetProjectMilestones,
  usePaymentsPaymentsControllerGetProjectPayments,
  usePaymentsPaymentsControllerInitiatePayment,
} from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { PaymentsPaymentsControllerGetMyPaymentsStatus } from '@nestlancer/api-client';
import type { PaginatedResponse, Payment, UserPaymentStats } from '@nestlancer/types';

export function usePaymentsListQuery(params: {
  page?: number;
  limit?: number;
  status?: string;
  enabled?: boolean;
}) {
  const { page = 1, limit = 20, status, enabled = true } = params;
  return usePaymentsPaymentsControllerGetMyPayments<PaginatedResponse<Payment>>(
    {
      page,
      limit,
      ...(status ? { status: status as PaymentsPaymentsControllerGetMyPaymentsStatus } : {}),
    },
    {
      query: {
        enabled,
        queryKey: [...queryKeys.payments.list({ status }), page],
        select: (data) => asPaginated<Payment>(data),
      },
    }
  );
}

export function usePaymentsStatsQuery() {
  return usePaymentsPaymentsControllerGetPaymentStats({
    query: {
      queryKey: queryKeys.payments.stats,
      select: (data) => data as unknown as UserPaymentStats,
    },
  });
}

export function usePaymentDetailQuery(id: string) {
  return usePaymentsPaymentsControllerGetPaymentDetails(id, {
    query: {
      queryKey: queryKeys.payments.detail(id),
      select: (data) => data as unknown as Payment,
    },
  });
}

export function usePaymentStatusQuery(id: string, enabled: boolean) {
  return usePaymentsPaymentsControllerGetPaymentStatus(id, {
    query: {
      enabled,
      queryKey: [...queryKeys.payments.detail(id), 'status'],
    },
  });
}

export function useProjectPaymentsQuery(projectId: string, enabled: boolean) {
  return usePaymentsPaymentsControllerGetProjectPayments(projectId, {
    query: {
      enabled,
      queryKey: [...queryKeys.projects.detail(projectId), 'payments'],
    },
  });
}

export function useProjectMilestonesQuery(projectId: string, enabled: boolean) {
  return usePaymentsPaymentsControllerGetProjectMilestones(projectId, {
    query: {
      enabled,
      queryKey: [...queryKeys.projects.milestones(projectId), 'payment-milestones'],
    },
  });
}

export {
  usePaymentsPaymentsControllerCreateIntent as useCreatePaymentIntentMutation,
  usePaymentsPaymentsControllerInitiatePayment as useInitiatePaymentMutation,
  usePaymentsPaymentsControllerConfirmPayment as useConfirmPaymentMutation,
  usePaymentsPaymentsControllerCancelPayment as useCancelPaymentMutation,
  usePaymentsPaymentsControllerFileDispute as useFilePaymentDisputeMutation,
};
