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
import { AUTH_PORTAL_COPY, getWebAppUrl, resolvePostLoginRedirect } from '@nestlancer/constants';
import { normalizeApiUserRole, type ApiUserProfile, type AuthUser } from '@nestlancer/types';

import { coerceAuthUser } from '@/lib/auth-user';
import { apiServices } from '@/lib/axios';

export function useAdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

      const role = normalizeApiUserRole(result.user.role);
      if (role !== 'admin') {
        const webOrigin = getWebAppUrl();
        const copy = AUTH_PORTAL_COPY.admin;
        if (webOrigin) {
          toast.error(copy.clientWrongPortalToastTitle, {
            description: copy.clientWrongPortalToastDescription,
            duration: 12_000,
            action: {
              label: copy.clientWrongPortalActionLabel,
              onClick: () => {
                window.location.href = `${webOrigin}/login`;
              },
            },
          });
        } else {
          toast.error(copy.clientWrongPortalToastTitle, {
            description: `${copy.clientWrongPortalToastDescription} ${copy.clientWrongPortalMissingUrlDescription}`,
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

      setUser(user);
      markHydrated();
      toast.success(AUTH_PORTAL_COPY.admin.operatorSignedInSuccess);

      router.push(resolvePostLoginRedirect(searchParams.get('from')));
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
        toast.error(AUTH_PORTAL_COPY.admin.rateLimitMessage(minutes));
        return;
      }
      if (code === 'AUTH_PORTAL_MISMATCH') {
        const webOrigin = getWebAppUrl();
        const copy = AUTH_PORTAL_COPY.admin;
        if (webOrigin) {
          toast.error(copy.clientWrongPortalToastTitle, {
            description: copy.clientWrongPortalToastDescription,
            duration: 12_000,
            action: {
              label: copy.clientWrongPortalActionLabel,
              onClick: () => {
                window.location.href = `${webOrigin}/login`;
              },
            },
          });
        } else {
          toast.error(copy.clientWrongPortalToastTitle, {
            description: `${copy.clientWrongPortalToastDescription} ${copy.clientWrongPortalMissingUrlDescription}`,
            duration: 14_000,
          });
        }
        return;
      }
      // Keep toast for immediate notice; AdminLoginForm also renders a persistent
      // inline alert so short-lived toasts cannot leave a silent failure (NL-BUG-AUTH-001).
      toast.error(getApiErrorMessage(err, 'Could not sign in. Check your credentials.'), {
        duration: 8_000,
      });
    },
  });

  return {
    ...mutation,
    twoFactorChallenge,
    pendingRememberMe,
    clearTwoFactor: () => {
      setTwoFactorChallenge(null);
      setPendingRememberMe(false);
    },
  };
}
