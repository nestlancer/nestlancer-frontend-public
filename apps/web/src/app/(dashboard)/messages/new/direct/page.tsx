import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New message' };

import { MessageNewDirectClient } from '@/features/messaging/MessageNewDirectClient';

export default function MessageNewDirectPage() {
  return <MessageNewDirectClient />;
}
