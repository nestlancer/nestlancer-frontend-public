import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — jobs live as a tab on `/system` (audit prompt 12). */
export const metadata: Metadata = { title: 'Jobs' };

export default function SystemJobsAliasPage() {
  redirect('/system?tab=jobs');
}
