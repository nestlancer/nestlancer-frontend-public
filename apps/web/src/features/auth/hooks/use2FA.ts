'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@nestlancer/constants';

import { apiServices } from '@/lib/axios';
import { asRecord } from '@/lib/client-api-view';

/** 2FA account status (settings). Login challenge uses `TwoFactorChallengeForm`. */
export function use2FA() {
  const statusQ = useQuery({
    queryKey: queryKeys.users.twoFactorStatus,
    queryFn: () => apiServices.users.get2FAStatus(),
  });

  const enabled = Boolean((asRecord(statusQ.data) ?? {}).enabled);

  return {
    enabled,
    isLoading: statusQ.isPending,
    isError: statusQ.isError,
    refetch: statusQ.refetch,
    /** @deprecated Use isLoading */
    pending: statusQ.isPending,
  };
}
