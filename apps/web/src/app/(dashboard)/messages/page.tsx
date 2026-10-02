import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Messages' };

import { MessagesOverviewClient } from '@/features/messaging/MessagesOverviewClient';

export default function Page() {
  return <MessagesOverviewClient />;
}
