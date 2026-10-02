'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { routes } from '@nestlancer/constants';
import { cn, messagingPanelClass } from '@nestlancer/ui';

export function MessagesLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isNewFlow = pathname.startsWith(`${routes.messages}/new`);
  const isOverview = pathname === routes.messages;

  if (isNewFlow) {
    return <div className={cn(messagingPanelClass, 'min-h-[50vh] p-4 sm:p-6')}>{children}</div>;
  }

  if (isOverview) {
    return <div className="w-full">{children}</div>;
  }

  return <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</div>;
}
