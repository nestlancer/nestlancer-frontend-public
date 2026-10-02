'use client';

import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { MessageThreadScrollArea } from './MessageThreadScrollArea';

export function MessageThreadPanel({
  itemCount,
  resetKey,
  header,
  children,
  composer,
  statusBar,
  emptyState,
  className,
  embedded,
}: {
  itemCount: number;
  resetKey?: string | number;
  header?: ReactNode;
  children: ReactNode;
  composer: ReactNode;
  statusBar?: ReactNode;
  emptyState?: ReactNode;
  className?: string;
  /** When true, panel fills parent without extra outer chrome (split-pane layout). */
  embedded?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden',
        !embedded && 'min-h-[24rem] rounded-lg border border-border bg-card',
        className
      )}
    >
      {header}

      <MessageThreadScrollArea
        itemCount={itemCount}
        resetKey={resetKey}
        className="chat-wallpaper flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6"
      >
        {itemCount === 0 && emptyState ? emptyState : children}
      </MessageThreadScrollArea>

      {statusBar}
      <div className="composer-glass shrink-0 p-3 sm:p-4">{composer}</div>
    </div>
  );
}
