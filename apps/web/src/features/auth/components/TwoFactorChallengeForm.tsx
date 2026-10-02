'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@nestlancer/ui';

import {
  getApiErrorMessage,
  isLoginTokens,
  type Auth2FAChallenge,
  type AuthLoginTokens,
} from '@nestlancer/api-client';
import { setTokens, useAuth } from '@nestlancer/auth';
import { AUTH_PORTAL_COPY, resolvePostLoginRedirect } from '@nestlancer/constants';
import type { ApiUserProfile, AuthUser } from '@nestlancer/types';
import { Button, Input, Spinner } from '@nestlancer/ui';

import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { coerceAuthUser } from '@/lib/auth-user';
import { authInputClass, authLabelClass, authPrimaryButtonClass } from '@/lib/tailadmin-classes';

import { useAuthUiStore } from '../store/authStore';

export function TwoFactorChallengeForm({
  challenge,
  rememberMe = false,
}: {
  challenge: Auth2FAChallenge;
  rememberMe?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setRedirect = useAuthUiStore((s) => s.setLoginRedirect);
  const { setUser, markHydrated } = useAuth();
  const [code, setCode] = useState('');
  /** null = auto-detect from input shape; otherwise honor explicit user choice */
  const [forcedMethod, setForcedMethod] = useState<'totp' | 'backupCode' | null>(null);

  const normalizedCode = code.trim().replace(/\s+/g, '');
  const looksLikeBackup =
    challenge.methodsAvailable?.includes('backupCode') === true &&
    normalizedCode.length > 0 &&
    !/^\d{6}$/.test(normalizedCode);
  const method: 'totp' | 'backupCode' = forcedMethod ?? (looksLikeBackup ? 'backupCode' : 'totp');

  const verify = useMutation({
    mutationFn: () =>
      apiServices.auth.verify2FA({
        authSessionId: challenge.authSessionId,
        code: normalizedCode,
        method,
        rememberMe,
      }),
    onSuccess: async (result: AuthLoginTokens) => {
      if (!isLoginTokens(result)) {
        toast.error('Unexpected response from verification');
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
      toast.success(AUTH_PORTAL_COPY.web.clientSignedInSuccess);
      router.push(resolvePostLoginRedirect(searchParams.get('from')));
      setRedirect(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Invalid verification code')),
  });

  return (
    <WebPanel padding="md">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Two-factor verification
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter the code from your authenticator app
            {challenge.methodsAvailable?.includes('backupCode') ? ' or a backup code' : ''}.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="two-factor-code" className={authLabelClass}>
            {method === 'backupCode' ? 'Backup code' : 'Verification code'}
          </label>
          <Input
            id="two-factor-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={method === 'backupCode' ? 'xxxx-xxxx-xxxx' : '000000'}
            autoComplete="one-time-code"
            inputMode={method === 'backupCode' ? 'text' : 'numeric'}
            className={authInputClass}
          />
        </div>
        {challenge.methodsAvailable?.includes('backupCode') ? (
          <button
            type="button"
            className="text-sm text-ta-brand-500 hover:text-ta-brand-600"
            onClick={() => {
              const next = method === 'backupCode' ? 'totp' : 'backupCode';
              setForcedMethod(next);
              setCode('');
            }}
          >
            {method === 'backupCode' ? 'Use authenticator code' : 'Use a backup code instead'}
          </button>
        ) : null}
        <Button
          type="button"
          className={authPrimaryButtonClass}
          disabled={!code.trim() || verify.isPending}
          onClick={() => verify.mutate()}
        >
          {verify.isPending ? (
            <>
              <Spinner className="h-4 w-4 border-2 border-white/40 border-t-white" />
              Verifying…
            </>
          ) : (
            'Verify and sign in'
          )}
        </Button>
      </div>
    </WebPanel>
  );
}
