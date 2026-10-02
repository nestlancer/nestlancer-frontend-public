import type { Metadata } from 'next';

import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function RegisterPage() {
  return (
    <>
      <AuthPageHeader
        title="Sign up"
        subtitle="Create your client account for the Nestlancer studio."
      />
      <RegisterForm />
    </>
  );
}
