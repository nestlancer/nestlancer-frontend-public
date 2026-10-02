import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Conversation' };

import { MessageThreadClient } from '@/features/messaging/MessageThreadClient';

export default function Page({ params }: { params: { conversationId: string } }) {
  return <MessageThreadClient projectId={params.conversationId} />;
}
