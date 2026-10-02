import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthPageHeader } from '@/components/auth/AuthPageHeader';

import { VerifyEmailClient } from './VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify email',
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthPageHeader
          title="Check your inbox"
          subtitle="Open the verification link we sent, or enter this page from that email."
        />
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
