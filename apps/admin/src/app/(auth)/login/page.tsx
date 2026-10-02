import type { Metadata } from 'next';

import { AdminLoginForm } from '@/features/auth/AdminLoginForm';
import { AdminLoginShell } from '@/features/auth/AdminLoginShell';

export const metadata: Metadata = {
  title: 'Operator sign-in',
};

export default function AdminLoginPage() {
  return (
    <AdminLoginShell>
      <AdminLoginForm />
    </AdminLoginShell>
  );
}
