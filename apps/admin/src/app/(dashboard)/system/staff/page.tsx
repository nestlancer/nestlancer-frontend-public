import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/**
 * Deep-link alias — there is no standalone staff console.
 * Operator accounts are managed from the users directory (NL-UI-002).
 */
export const metadata: Metadata = { title: 'Staff' };

export default function SystemStaffAliasPage() {
  redirect('/users?role=ADMIN');
}
