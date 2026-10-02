import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthPageHeader } from '@/components/auth/AuthPageHeader';

import { ResetPasswordClient } from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPageHeader
          title="Reset password"
          subtitle="Use the link from your password reset email, or request a new one."
        />
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
