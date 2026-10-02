import type { Metadata } from 'next';
import { AdminNewDirectClient } from '@/features/messages/AdminNewDirectClient';

export const metadata: Metadata = { title: 'New direct message' };

export default function Page() {
  return <AdminNewDirectClient />;
}
