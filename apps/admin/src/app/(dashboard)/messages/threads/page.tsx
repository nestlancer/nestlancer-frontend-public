import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Threads' };

export default function AdminMessageThreadsPage() {
  redirect('/messages/inbox');
}
