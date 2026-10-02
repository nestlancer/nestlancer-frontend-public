import type { Metadata } from 'next';
import { AdminChatThreadClient } from '@/features/messages/AdminChatThreadClient';

export const metadata: Metadata = { title: 'Message thread' };

export default function Page({ params }: { params: { threadId: string } }) {
  return <AdminChatThreadClient threadId={params.threadId} />;
}
