import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'New message' };

export default function AdminNewMessagePage() {
  redirect('/messages/new-direct');
}
