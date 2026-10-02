import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — announcements live under System → Operations. */
export const metadata: Metadata = { title: 'Announcements' };

export default function SystemAnnouncementsAliasPage() {
  redirect('/system?tab=operations');
}
