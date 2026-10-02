'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes, resolveTurnstileToken } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Input } from '@nestlancer/ui';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@nestlancer/validators';

import { TurnstileWidget } from '@/components/security/TurnstileWidget';
import { apiServices } from '@/lib/axios';
import { authInputClass, authLinkClass, authPrimaryButtonClass } from '@/lib/tailadmin-classes';

const RESET_ACK =
  'If an account exists for that email, we sent password reset instructions. Check your inbox and spam folder.';

export function PasswordResetForm() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const onTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: (email: string) => {
      let token: string;
      try {
        token = resolveTurnstileToken(turnstileToken);
      } catch {
        throw new Error('Security verification is required. Retry the check, then try again.');
      }
      return apiServices.auth.forgotPassword({ email, turnstileToken: token });
    },
    onSuccess: (_data, email) => {
      setSubmittedEmail(email);
      toast.success(RESET_ACK);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Could not send reset link.')),
  });

  if (submittedEmail) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="font-medium">Reset link requested</p>
          <p className="mt-1 opacity-90">{RESET_ACK}</p>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-400">
          Submitted for <span className="font-medium">{submittedEmail}</span>.
        </p>
        <Button
          className={authPrimaryButtonClass}
          type="button"
          onClick={() => {
            setSubmittedEmail(null);
            form.reset({ email: submittedEmail });
          }}
        >
          Send another link
        </Button>
        <p className="text-center text-sm text-gray-700 dark:text-gray-400">
          Remembered it?{' '}
          <Link className={authLinkClass} href={routes.login}>
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(({ email }) => mutation.mutate(email))}
      noValidate
    >
      <div className="space-y-2">
        <FormFieldLabel htmlFor="reset-email" fieldKey="auth.email" label="Email">
          Email
        </FormFieldLabel>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className={authInputClass}
          {...form.register('email')}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <TurnstileWidget onToken={onTurnstileToken} />
      {mutation.isError ? (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {getApiErrorMessage(mutation.error, 'Could not send reset link.')}
        </div>
      ) : null}
      <Button className={authPrimaryButtonClass} type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm text-gray-700 dark:text-gray-400">
        Remembered it?{' '}
        <Link className={authLinkClass} href={routes.login}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
