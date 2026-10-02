import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Messaging panel' };

import { MessagesPanelClient } from '@/features/messaging/MessagesPanelClient';

export default function Page() {
  return <MessagesPanelClient />;
}
