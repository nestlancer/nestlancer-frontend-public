'use client';

import type { KeyboardEvent } from 'react';

import { ChevronDown, X } from '../../icons';
import { cn } from '../../utils/cn';
import { PeerViewStatusBadge, type PeerViewState } from './PeerViewStatusBadge';

export function ChatDockWindowHeader({
  title,
  subtitle,
  initials,
  variant = 'admin',
  peerViewState,
  peerViewPerspective = 'admin',
  onFocus,
  onMinimize,
  onClose,
}: {
  title: string;
  subtitle: string;
  initials: string;
  variant?: 'admin' | 'aurora';
  peerViewState?: PeerViewState | null;
  peerViewPerspective?: 'admin' | 'client';
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const isAurora = variant === 'aurora';

  const onHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onFocus();
    }
  };

  return (
    <div
      className={cn('chat-window-header', isAurora && 'chat-window-header-aurora')}
      onClick={onFocus}
      onDoubleClick={(event) => {
        event.preventDefault();
        onMinimize();
      }}
      onKeyDown={onHeaderKeyDown}
      role="button"
      tabIndex={0}
      title="Double-click to minimize"
    >
      <div className={cn('chat-window-avatar', isAurora && 'chat-window-avatar-aurora')}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('chat-window-title truncate', isAurora && 'text-foreground')}>{title}</p>
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={cn(
              'chat-window-subtitle min-w-0 truncate',
              isAurora && 'text-muted-foreground'
            )}
          >
            {subtitle}
          </p>
          <PeerViewStatusBadge state={peerViewState} perspective={peerViewPerspective} short />
        </div>
      </div>
      <div className="chat-window-controls">
        <button
          type="button"
          className="chat-window-btn chat-window-btn--minimize"
          aria-label="Minimize conversation"
          title="Minimize conversation"
          onClick={(event) => {
            event.stopPropagation();
            onMinimize();
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="chat-window-btn chat-window-btn--close"
          aria-label="Close conversation"
          title="Close conversation"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
