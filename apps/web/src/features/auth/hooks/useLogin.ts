'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@nestlancer/ui';

import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiRetryAfterSeconds,
  isLoginTokens,
  type Auth2FAChallenge,
  type AuthLoginResult,
  type LoginPayload,
} from '@nestlancer/api-client';
import { setTokens, useAuth } from '@nestlancer/auth';
import { AUTH_PORTAL_COPY, getAdminAppUrl, resolvePostLoginRedirect } from '@nestlancer/constants';
import { normalizeApiUserRole, type ApiUserProfile, type AuthUser } from '@nestlancer/types';

import { useAuthUiStore } from '../store/authStore';
import { apiServices } from '@/lib/axios';
import { coerceAuthUser } from '@/lib/auth-user';

async function completeLogin(
  result: Extract<AuthLoginResult, { accessToken: string }>,
  ctx: {
    setUser: (u: AuthUser) => void;
    markHydrated: () => void;
    router: ReturnType<typeof useRouter>;
    searchParams: ReturnType<typeof useSearchParams>;
    setRedirect: (v: string | null) => void;
  }
) {
  const role = normalizeApiUserRole(result.user.role);
  if (role === 'admin') {
    const adminOrigin = getAdminAppUrl();
    const copy = AUTH_PORTAL_COPY.web;
    if (adminOrigin) {
      toast.error(copy.adminWrongPortalToastTitle, {
        description: copy.adminWrongPortalToastDescription,
        duration: 12_000,
        action: {
          label: copy.adminWrongPortalActionLabel,
          onClick: () => {
            window.location.href = `${adminOrigin}/login`;
          },
        },
      });
    } else {
      toast.error(copy.adminWrongPortalToastTitle, {
        description: `${copy.adminWrongPortalToastDescription} ${copy.adminWrongPortalMissingUrlDescription}`,
        duration: 14_000,
      });
    }
    return;
  }

  setTokens({
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    tokenType: result.tokenType,
  });

  let user: AuthUser;
  try {
    const profile = await apiServices.users.getProfile({ accessToken: result.accessToken });
    user = coerceAuthUser(profile);
  } catch {
    user = coerceAuthUser({
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      avatarUrl: result.user.avatar,
      emailVerified: result.user.emailVerified,
      role: result.user.role,
    } as ApiUserProfile);
  }

  ctx.setUser(user);
  ctx.markHydrated();
  toast.success(AUTH_PORTAL_COPY.web.clientSignedInSuccess);
  const target = resolvePostLoginRedirect(ctx.searchParams.get('from'));
  ctx.router.push(target);
  ctx.setRedirect(null);
}

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setRedirect = useAuthUiStore((s) => s.setLoginRedirect);
  const { setUser, markHydrated } = useAuth();
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<Auth2FAChallenge | null>(null);
  const [pendingRememberMe, setPendingRememberMe] = useState(false);

  const mutation = useMutation<AuthLoginResult, unknown, LoginPayload>({
    mutationFn: (payload) => apiServices.auth.login(payload),
    onSuccess: async (result, variables) => {
      if (!isLoginTokens(result)) {
        setTwoFactorChallenge(result);
        setPendingRememberMe(Boolean(variables.rememberMe));
        return;
      }
      await completeLogin(result, {
        setUser,
        markHydrated,
        router,
        searchParams,
        setRedirect,
      });
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      const retryAfterSeconds = getApiRetryAfterSeconds(err);
      if (
        retryAfterSeconds ||
        code === 'RATE_LIMIT_EXCEEDED' ||
        (err as { status?: number })?.status === 429
      ) {
        const minutes = Math.max(1, Math.ceil((retryAfterSeconds ?? 1800) / 60));
        toast.error(AUTH_PORTAL_COPY.web.rateLimitMessage(minutes));
        return;
      }
      if (code === 'AUTH_PORTAL_MISMATCH') {
        const adminOrigin = getAdminAppUrl();
        const copy = AUTH_PORTAL_COPY.web;
        if (adminOrigin) {
          toast.error(copy.adminWrongPortalToastTitle, {
            description: copy.adminWrongPortalToastDescription,
            duration: 12_000,
            action: {
              label: copy.adminWrongPortalActionLabel,
              onClick: () => {
                window.location.href = `${adminOrigin}/login`;
              },
            },
          });
        } else {
          toast.error(copy.adminWrongPortalToastTitle, {
            description: `${copy.adminWrongPortalToastDescription} ${copy.adminWrongPortalMissingUrlDescription}`,
            duration: 14_000,
          });
        }
        return;
      }
      toast.error(getApiErrorMessage(err, 'Could not sign in. Check your credentials.'));
    },
  });

  return {
    ...mutation,
    mutate: (payload: LoginPayload) => mutation.mutate(payload),
    mutateAsync: (payload: LoginPayload) => mutation.mutateAsync(payload),
    twoFactorChallenge,
    pendingRememberMe,
    clearTwoFactor: () => {
      setTwoFactorChallenge(null);
      setPendingRememberMe(false);
    },
  };
}
