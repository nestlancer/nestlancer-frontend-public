import type { Metadata } from 'next';

import { MessagesPanelClient } from '@/features/messaging/MessagesPanelClient';

export const metadata: Metadata = { title: 'Archived messages' };

export default function ArchivedMessagesPage() {
  return <MessagesPanelClient inbox="archived" />;
}
