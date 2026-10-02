import type { Metadata } from 'next';
import { AdminNewGroupChatClient } from '@/features/messages/AdminNewGroupChatClient';

export const metadata: Metadata = { title: 'New group' };

export default function Page() {
  return <AdminNewGroupChatClient />;
}
