'use client';

import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { Button } from '../primitives/button/Button';
import { useMessageThreadScroll } from './use-message-thread-scroll';

export function MessageThreadScrollArea({
  itemCount,
  resetKey,
  children,
  className,
  jumpButtonClassName,
}: {
  itemCount: number;
  resetKey?: string | number;
  children: ReactNode;
  className?: string;
  jumpButtonClassName?: string;
}) {
  const { viewportRef, showJumpToLatest, scrollToBottom, onScroll } = useMessageThreadScroll(
    itemCount,
    resetKey
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <ul ref={viewportRef} onScroll={onScroll} className={cn('min-h-0 flex-1', className)}>
        {children}
      </ul>

      {showJumpToLatest ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-3 flex justify-center',
            jumpButtonClassName
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="pointer-events-auto rounded-full border-border bg-card px-3 py-1.5 text-[11px] font-semibold shadow-lg sm:px-4 sm:py-2 sm:text-xs"
            onClick={() => scrollToBottom()}
          >
            ↓ Jump to latest
          </Button>
        </div>
      ) : null}
    </div>
  );
}
