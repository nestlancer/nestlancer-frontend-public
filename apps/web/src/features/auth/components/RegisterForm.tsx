'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import { apiServices } from '@/lib/axios';

import { AUTH_PORTAL_COPY, routes, resolveTurnstileToken } from '@nestlancer/constants';
import { registerSchema, type RegisterInput } from '@nestlancer/validators';
import { FieldHelp, FormFieldLabel } from '@nestlancer/field-help';
import { Button, Input } from '@nestlancer/ui';

import { TurnstileWidget } from '@/components/security/TurnstileWidget';
import {
  authCheckboxClass,
  authInputClass,
  authLinkClass,
  authPrimaryButtonClass,
} from '@/lib/tailadmin-classes';

import { useRegister } from '../hooks/useRegister';

export function RegisterForm() {
  const registerMutation = useRegister();
  const [emailAvailability, setEmailAvailability] = useState<'unknown' | 'available' | 'taken'>(
    'unknown'
  );
  const [emailChecking, setEmailChecking] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptTerms: false,
      marketingConsent: false,
    },
  });

  const checkEmailAvailability = useCallback(
    async (email: string) => {
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes('@')) {
        setEmailAvailability('unknown');
        return;
      }
      setEmailChecking(true);
      try {
        let token: string;
        try {
          token = resolveTurnstileToken(turnstileToken);
        } catch {
          token = resolveTurnstileToken();
        }
        const result = await apiServices.auth.checkEmail({
          email: trimmed,
          turnstileToken: token,
        });
        setEmailAvailability(result.available ? 'available' : 'taken');
        if (!result.available) {
          form.setError('email', { message: 'This email is already registered' });
        } else {
          form.clearErrors('email');
        }
      } catch {
        setEmailAvailability('unknown');
      } finally {
        setEmailChecking(false);
      }
    },
    [form, turnstileToken]
  );

  return (
    <form
      className="space-y-3 sm:space-y-5"
      onSubmit={form.handleSubmit((values) => {
        let token: string;
        try {
          token = resolveTurnstileToken(turnstileToken);
        } catch {
          form.setError('root', {
            message: 'Security verification is required. Retry the check, then try again.',
          });
          return;
        }
        registerMutation.mutate({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          acceptTerms: values.acceptTerms,
          marketingConsent: values.marketingConsent,
          turnstileToken: token,
        });
      })}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <FormFieldLabel htmlFor="firstName" fieldKey="auth.firstName" label="First name" required>
            First name
          </FormFieldLabel>
          <Input
            id="firstName"
            autoComplete="given-name"
            placeholder="Your first name"
            className={authInputClass}
            {...form.register('firstName')}
          />
          {form.formState.errors.firstName ? (
            <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <FormFieldLabel htmlFor="lastName" fieldKey="auth.lastName" label="Last name" required>
            Last name
          </FormFieldLabel>
          <Input
            id="lastName"
            autoComplete="family-name"
            placeholder="Your last name"
            className={authInputClass}
            {...form.register('lastName')}
          />
          {form.formState.errors.lastName ? (
            <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <FormFieldLabel htmlFor="email" fieldKey="auth.email" label="Email" required>
          Email
        </FormFieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className={authInputClass}
          {...form.register('email', {
            onBlur: (e) => void checkEmailAvailability(e.target.value),
          })}
        />
        {emailChecking ? (
          <p className="text-xs text-muted-foreground">Checking availability…</p>
        ) : emailAvailability === 'available' ? (
          <p className="text-xs text-emerald-600">Email is available</p>
        ) : null}
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <FormFieldLabel
          htmlFor="password"
          fieldKey="auth.registerPassword"
          label="Password"
          required
        >
          Password
        </FormFieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          className={authInputClass}
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <FormFieldLabel
          htmlFor="confirmPassword"
          fieldKey="auth.confirmPassword"
          label="Confirm password"
          required
        >
          Confirm password
        </FormFieldLabel>
        <Input
          id="confirmPassword"
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

      <div className="space-y-3 pt-1">
        <div className="flex items-start gap-2 text-sm">
          <input
            id="acceptTerms"
            type="checkbox"
            className={authCheckboxClass}
            {...form.register('acceptTerms')}
          />
          <label
            htmlFor="acceptTerms"
            className="inline-flex flex-wrap items-center gap-x-1 text-gray-600 dark:text-gray-400"
          >
            <span>I agree to the</span>
            <FieldHelp fieldKey="auth.acceptTerms" label="Terms acceptance" />
            <Link href="/terms" className={authLinkClass}>
              Terms of Service
            </Link>
            <span>and</span>
            <Link href="/privacy" className={authLinkClass}>
              Privacy Policy.
            </Link>
          </label>
        </div>
        {form.formState.errors.acceptTerms ? (
          <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
        ) : null}

        <div className="flex items-start gap-2 text-sm">
          <input
            id="marketingConsent"
            type="checkbox"
            className={authCheckboxClass}
            {...form.register('marketingConsent')}
          />
          <FormFieldLabel
            htmlFor="marketingConsent"
            fieldKey="auth.marketingConsent"
            label="Marketing consent"
          >
            Send me product updates and announcements.
          </FormFieldLabel>
        </div>
      </div>

      <TurnstileWidget onToken={onTurnstileToken} />
      {form.formState.errors.root?.message ? (
        <p className="text-xs text-destructive">{form.formState.errors.root.message}</p>
      ) : null}

      <Button
        className={authPrimaryButtonClass}
        type="submit"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Creating account…' : 'Sign up'}
      </Button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        {AUTH_PORTAL_COPY.webRegister.footerNote}
      </p>

      <p className="text-center text-sm text-gray-700 dark:text-gray-400">
        Already have an account?{' '}
        <Link className={authLinkClass} href={routes.login}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
