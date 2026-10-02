import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Conversation' };

import { MessageChatThreadClient } from '@/features/messaging/MessageChatThreadClient';

export default function Page({ params }: { params: { threadId: string } }) {
  return <MessageChatThreadClient threadId={params.threadId} />;
}
