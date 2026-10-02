import type { ReactNode } from 'react';

import { MessagesLayoutShell } from '@/features/messaging/MessagesLayoutShell';

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return <MessagesLayoutShell>{children}</MessagesLayoutShell>;
}
