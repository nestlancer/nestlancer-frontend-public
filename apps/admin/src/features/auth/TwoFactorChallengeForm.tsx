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

import { coerceAuthUser } from '@/lib/auth-user';
import { apiServices } from '@/lib/axios';

export function TwoFactorChallengeForm({
  challenge,
  rememberMe = false,
}: {
  challenge: Auth2FAChallenge;
  rememberMe?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, markHydrated } = useAuth();
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);

  const verify = useMutation({
    mutationFn: () =>
      apiServices.auth.verify2FA({
        authSessionId: challenge.authSessionId,
        code: code.trim(),
        method: useBackup ? 'backupCode' : 'totp',
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
      toast.success(AUTH_PORTAL_COPY.admin.operatorSignedInSuccess);
      router.push(resolvePostLoginRedirect(searchParams.get('from')));
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Invalid verification code')),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--op-text)]">Two-factor verification</h2>
      <p className="text-sm text-[var(--op-muted)]">Enter your authenticator or backup code.</p>
      <div className="op-field">
        <label htmlFor="two-factor-code">{useBackup ? 'Backup code' : 'Verification code'}</label>
        <input
          id="two-factor-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={useBackup ? 'xxxx-xxxx-xxxx' : '000000'}
          autoComplete="one-time-code"
          inputMode="numeric"
          required
        />
      </div>
      {challenge.methodsAvailable?.includes('backupCode') ? (
        <button
          type="button"
          className="text-xs text-[var(--op-teal)] underline underline-offset-2"
          onClick={() => setUseBackup((v) => !v)}
        >
          {useBackup ? 'Use authenticator' : 'Use backup code'}
        </button>
      ) : null}
      <button
        type="button"
        className="op-submit"
        disabled={!code.trim() || verify.isPending}
        onClick={() => verify.mutate()}
      >
        {verify.isPending ? 'Verifying…' : 'Verify and sign in'}
      </button>
    </div>
  );
}
