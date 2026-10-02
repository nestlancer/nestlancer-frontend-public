'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from '@nestlancer/ui';

import {
  getApiErrorMessage,
  type RegisterPayload,
  type RegisterResult,
} from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { writeOneShotSessionValue, SENSITIVE_SESSION_KEYS } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';

export function useRegister() {
  const router = useRouter();

  return useMutation<RegisterResult, unknown, RegisterPayload>({
    mutationFn: (payload) => apiServices.auth.register(payload),
    onSuccess: (result) => {
      toast.success('Account created. Check your email to verify the address.');
      writeOneShotSessionValue(SENSITIVE_SESSION_KEYS.postRegisterEmail, result.email);
      router.push(routes.verifyEmail);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Registration failed.'));
    },
  });
}
