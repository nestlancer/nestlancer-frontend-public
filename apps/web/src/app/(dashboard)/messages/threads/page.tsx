import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Message threads' };

export default function MessageThreadsPage() {
  redirect('/messages/inbox');
}
