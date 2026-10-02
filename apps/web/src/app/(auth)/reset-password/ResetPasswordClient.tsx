'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes, resolveTurnstileToken } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Input, TurnstileWidget } from '@nestlancer/ui';
import { resetPasswordSchema, type ResetPasswordInput } from '@nestlancer/validators';
import {
  SENSITIVE_SESSION_KEYS,
  readOneShotSessionValue,
  stashSensitiveQueryParam,
} from '@nestlancer/utils';

import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { apiServices } from '@/lib/axios';
import { authInputClass, authLinkClass, authPrimaryButtonClass } from '@/lib/tailadmin-classes';

export function ResetPasswordClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = stashSensitiveQueryParam(
      'token',
      SENSITIVE_SESSION_KEYS.resetPasswordToken,
      pathname,
      new URLSearchParams(searchParams.toString()),
      (next) => router.replace(next)
    );
    const resolved = fromUrl ?? readOneShotSessionValue(SENSITIVE_SESSION_KEYS.resetPasswordToken);
    if (resolved) setToken(resolved);
  }, [pathname, router, searchParams]);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (token) form.setValue('token', token);
  }, [token, form]);

  const mutation = useMutation({
    mutationFn: (input: ResetPasswordInput) => {
      const turnstile = resolveTurnstileToken(turnstileToken);
      return apiServices.auth.resetPassword({
        token: input.token,
        password: input.password,
        turnstileToken: turnstile,
      });
    },
    onSuccess: () => {
      toast.success('Password updated. Please sign in.');
      router.push(routes.login);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Could not reset password.')),
  });

  if (!token) {
    return (
      <>
        <AuthPageHeader
          title="Missing reset token"
          subtitle="Use the link from your password reset email, or request a new one."
        />
        <Button asChild className={authPrimaryButtonClass}>
          <Link href={routes.forgotPassword}>Request a new link</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthPageHeader
        title="Choose a new password"
        subtitle="Enter a strong password you have not used on Nestlancer before."
      />
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => {
          try {
            resolveTurnstileToken(turnstileToken);
          } catch (error) {
            setCaptchaError(
              error instanceof Error ? error.message : 'Security verification is required.'
            );
            return;
          }
          setCaptchaError(null);
          mutation.mutate(values);
        })}
        noValidate
      >
        <input type="hidden" {...form.register('token')} />
        <div className="space-y-2">
          <FormFieldLabel
            htmlFor="new-password"
            fieldKey="auth.registerPassword"
            label="New password"
          >
            New password
          </FormFieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a new password"
            className={authInputClass}
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <FormFieldLabel
            htmlFor="confirm-password"
            fieldKey="auth.confirmPassword"
            label="Confirm password"
          >
            Confirm password
          </FormFieldLabel>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className={authInputClass}
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
        <TurnstileWidget onToken={setTurnstileToken} />
        {captchaError ? (
          <p className="text-sm text-destructive" role="alert">
            {captchaError}
          </p>
        ) : null}
        <Button className={authPrimaryButtonClass} type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Updating…' : 'Update password'}
        </Button>
        <p className="text-center text-sm text-gray-700 dark:text-gray-400">
          <Link className={authLinkClass} href={routes.login}>
            Back to sign in
          </Link>
        </p>
      </form>
    </>
  );
}
