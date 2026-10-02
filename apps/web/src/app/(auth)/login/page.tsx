import type { Metadata } from 'next';
import { LogIn } from '@nestlancer/ui/icons';

import { AUTH_PORTAL_COPY } from '@nestlancer/constants';

import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: { absolute: 'Sign In · Nestlancer Client Portal' },
};

export default function LoginPage() {
  return (
    <>
      <AuthPageHeader
        title="Sign in"
        subtitle={AUTH_PORTAL_COPY.web.loginPageSubtitle}
        icon={<LogIn className="h-5 w-5" aria-hidden />}
      />
      <LoginForm />
    </>
  );
}
