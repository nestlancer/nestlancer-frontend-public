import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — maintenance controls live under System → Operations. */
export const metadata: Metadata = { title: 'Maintenance' };

export default function SystemMaintenanceAliasPage() {
  redirect('/system?tab=operations');
}
