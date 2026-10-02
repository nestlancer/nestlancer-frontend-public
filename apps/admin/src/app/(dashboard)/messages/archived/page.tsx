import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Archived messages' };

export default function AdminArchivedMessagesPage() {
  redirect('/messages/inbox');
}
