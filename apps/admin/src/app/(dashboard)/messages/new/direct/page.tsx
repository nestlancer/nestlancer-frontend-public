import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Legacy path alias — live compose is `/messages/new-direct` (NL-UI-003). */
export const metadata: Metadata = { title: 'New direct message' };

export default function LegacyAdminNewDirectPage() {
  redirect('/messages/new-direct');
}
