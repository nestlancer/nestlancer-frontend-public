'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import {
  getAdminAppUrl,
  routes,
  AUTH_PORTAL_COPY,
  resolveTurnstileToken,
} from '@nestlancer/constants';
import { loginSchema, type LoginInput } from '@nestlancer/validators';
import { Button, Input, Spinner, cn, TurnstileWidget } from '@nestlancer/ui';
import { getApiErrorMessage } from '@nestlancer/api-client';

import {
  authCheckboxClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
} from '@/lib/tailadmin-classes';

import { useState } from 'react';

import { useLogin } from '../hooks/useLogin';
import { TwoFactorChallengeForm } from './TwoFactorChallengeForm';

export function LoginForm() {
  const login = useLogin();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  if (login.twoFactorChallenge) {
    return (
      <TwoFactorChallengeForm
        challenge={login.twoFactorChallenge}
        rememberMe={login.pendingRememberMe}
      />
    );
  }

  const authError =
    login.isError && login.error
      ? getApiErrorMessage(login.error, 'Could not sign in. Check your credentials.')
      : null;

  const emailErrorId = 'login-email-error';
  const passwordErrorId = 'login-password-error';

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        const email = values.email.trim();
        let token: string;
        try {
          token = resolveTurnstileToken(turnstileToken);
        } catch (error) {
          setCaptchaError(
            error instanceof Error ? error.message : 'Security verification is required.'
          );
          return;
        }
        setCaptchaError(null);
        login.mutate({
          email,
          password: values.password,
          rememberMe: values.rememberMe,
          turnstileToken: token,
        });
      })}
      noValidate
    >
      {authError ? (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {authError}
        </div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="email" className={authLabelClass}>
          Email <span className="text-red-500">*</span>
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className={authInputClass}
          aria-invalid={form.formState.errors.email ? true : undefined}
          aria-describedby={form.formState.errors.email ? emailErrorId : undefined}
          {...form.register('email')}
        />
        {form.formState.errors.email ? (
          <p id={emailErrorId} className="text-sm text-destructive" role="alert">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className={authLabelClass}>
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={cn(authInputClass, 'pr-16')}
            aria-invalid={form.formState.errors.password ? true : undefined}
            aria-describedby={form.formState.errors.password ? passwordErrorId : undefined}
            {...form.register('password')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {form.formState.errors.password ? (
          <p id={passwordErrorId} className="text-sm text-destructive" role="alert">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-gray-700 dark:text-gray-400">
          <input
            id="rememberMe"
            type="checkbox"
            className={authCheckboxClass}
            {...form.register('rememberMe')}
          />
          Keep me signed in
        </label>
        <Link className={cn('text-sm', authLinkClass)} href={routes.forgotPassword}>
          Forgot password?
        </Link>
      </div>

      <TurnstileWidget onToken={setTurnstileToken} />
      {captchaError ? (
        <p className="text-sm text-destructive" role="alert">
          {captchaError}
        </p>
      ) : null}

      <Button className={authPrimaryButtonClass} type="submit" disabled={login.isPending}>
        {login.isPending ? (
          <>
            <Spinner className="h-4 w-4 border-2 border-white/40 border-t-white" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <p className="text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {AUTH_PORTAL_COPY.web.loginFooterLead}{' '}
        {getAdminAppUrl() ? (
          <a className={authLinkClass} href={`${getAdminAppUrl()}/login`}>
            {AUTH_PORTAL_COPY.web.loginFooterLinkLabel}
          </a>
        ) : (
          <span>{AUTH_PORTAL_COPY.web.loginFooterMissingUrl}</span>
        )}
      </p>
      <p className="text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {AUTH_PORTAL_COPY.web.loginFooterTrail}
      </p>

      <p className="text-center text-sm text-gray-700 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link className={authLinkClass} href={routes.register}>
          Sign up
        </Link>
      </p>
    </form>
  );
}
