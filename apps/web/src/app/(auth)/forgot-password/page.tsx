import type { Metadata } from 'next';

import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { PasswordResetForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthPageHeader
        title="Forgot password?"
        subtitle="Enter your email and we will send you a secure reset link."
      />
      <PasswordResetForm />
    </>
  );
}
