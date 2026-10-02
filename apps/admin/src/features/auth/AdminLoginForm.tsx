'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { getWebAppUrl, AUTH_PORTAL_COPY, resolveTurnstileToken } from '@nestlancer/constants';
import { TurnstileWidget } from '@nestlancer/ui';
import { loginSchema, type LoginInput } from '@nestlancer/validators';

import { useAdminLogin } from './useAdminLogin';
import { TwoFactorChallengeForm } from './TwoFactorChallengeForm';

export function AdminLoginForm() {
  const login = useAdminLogin();
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

  const emailErrorId = 'admin-email-error';
  const passwordErrorId = 'admin-password-error';

  return (
    <form
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
          portal: 'admin',
        });
      })}
      noValidate
    >
      {authError ? (
        <div className="op-banner-error" role="alert" aria-live="assertive">
          {authError}
        </div>
      ) : null}
      <div className="op-field">
        <label htmlFor="admin-email">Work email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          placeholder="you@company.com"
          enterKeyHint="next"
          aria-invalid={form.formState.errors.email ? true : undefined}
          aria-describedby={form.formState.errors.email ? emailErrorId : undefined}
          {...form.register('email')}
        />
        {form.formState.errors.email ? (
          <p id={emailErrorId} className="op-error" role="alert">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="op-field">
        <label htmlFor="current-password">Password</label>
        <div className="op-password-wrap">
          <input
            id="current-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            enterKeyHint="done"
            aria-invalid={form.formState.errors.password ? true : undefined}
            aria-describedby={form.formState.errors.password ? passwordErrorId : undefined}
            {...form.register('password')}
          />
          <button
            type="button"
            className="op-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {form.formState.errors.password ? (
          <p id={passwordErrorId} className="op-error" role="alert">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="op-form-row">
        <label htmlFor="admin-remember">
          <input id="admin-remember" type="checkbox" {...form.register('rememberMe')} />
          Keep me signed in
        </label>
      </div>

      <TurnstileWidget onToken={setTurnstileToken} />
      {captchaError ? (
        <p className="op-error" role="alert">
          {captchaError}
        </p>
      ) : null}

      <button className="op-submit" type="submit" disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Enter console'}
      </button>

      <p className="op-foot">
        {AUTH_PORTAL_COPY.admin.loginFooterLead}{' '}
        {getWebAppUrl() ? (
          <Link href={`${getWebAppUrl()}/login`}>
            {AUTH_PORTAL_COPY.admin.loginFooterLinkLabel}
          </Link>
        ) : (
          <span>{AUTH_PORTAL_COPY.admin.loginFooterMissingUrl}</span>
        )}
      </p>
    </form>
  );
}
