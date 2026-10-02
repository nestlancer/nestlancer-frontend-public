'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';
import {
  SENSITIVE_SESSION_KEYS,
  readOneShotSessionValue,
  stashSensitiveQueryParam,
} from '@nestlancer/utils';

import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { apiServices } from '@/lib/axios';
import { authLinkClass, authPrimaryButtonClass } from '@/lib/tailadmin-classes';

type Status = 'idle' | 'verifying' | 'success' | 'error';

export function VerifyEmailClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [emailFromSession, setEmailFromSession] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const ran = useRef(false);

  useEffect(() => {
    const fromUrl = stashSensitiveQueryParam(
      'token',
      SENSITIVE_SESSION_KEYS.verifyEmailToken,
      pathname,
      new URLSearchParams(searchParams.toString()),
      (next) => router.replace(next)
    );
    const resolved = fromUrl ?? readOneShotSessionValue(SENSITIVE_SESSION_KEYS.verifyEmailToken);
    if (resolved) {
      setToken(resolved);
      setStatus('verifying');
    }

    const storedEmail = readOneShotSessionValue(SENSITIVE_SESSION_KEYS.postRegisterEmail);
    if (storedEmail) setEmailFromSession(storedEmail);
  }, [pathname, router, searchParams]);

  const verifyMutation = useMutation({
    mutationFn: (verifyToken: string) => apiServices.auth.verifyEmail({ token: verifyToken }),
  });

  const resendMutation = useMutation({
    mutationFn: (email: string) => apiServices.auth.resendVerification({ email }),
    onSuccess: () => toast.success('Verification email sent. Check your inbox.'),
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Could not resend email.')),
  });

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    verifyMutation
      .mutateAsync(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email is verified. You can now sign in.');
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(getApiErrorMessage(err, 'The verification link is invalid or has expired.'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const displayEmail = emailFromSession;

  if (status === 'verifying') {
    return (
      <AuthPageHeader
        title="Verifying your email…"
        subtitle="Hang tight, this usually takes a second."
      />
    );
  }

  if (status === 'success') {
    return (
      <>
        <AuthPageHeader title="Email verified" subtitle={message} />
        <Button asChild className={authPrimaryButtonClass}>
          <Link href={routes.login}>Go to sign in</Link>
        </Button>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <AuthPageHeader title="We couldn't verify that link" subtitle={message} />
        {displayEmail ? (
          <Button
            type="button"
            variant="outline"
            className="mb-3 h-11 w-full rounded-lg border-gray-200 dark:border-gray-700"
            disabled={resendMutation.isPending}
            onClick={() => resendMutation.mutate(displayEmail)}
          >
            {resendMutation.isPending ? 'Sending…' : 'Resend verification email'}
          </Button>
        ) : null}
        <p className="text-center text-sm text-gray-700 dark:text-gray-400">
          <Link className={authLinkClass} href={routes.login}>
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <AuthPageHeader
        title="Check your inbox"
        subtitle={
          displayEmail
            ? `We sent a verification link to ${displayEmail}. Click it to activate your workspace.`
            : 'We sent a verification link to your email. Click it to activate your workspace.'
        }
      />
      {displayEmail ? (
        <Button
          type="button"
          variant="outline"
          className="mb-3 h-11 w-full rounded-lg border-gray-200 dark:border-gray-700"
          disabled={resendMutation.isPending}
          onClick={() => resendMutation.mutate(displayEmail)}
        >
          {resendMutation.isPending ? 'Sending…' : 'Resend email'}
        </Button>
      ) : null}
      <p className="text-center text-sm text-gray-700 dark:text-gray-400">
        Already verified?{' '}
        <Link className={authLinkClass} href={routes.login}>
          Sign in
        </Link>
      </p>
    </>
  );
}
