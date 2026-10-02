'use client';

import { X } from '../../icons';
import { cn } from '../../utils/cn';

export function ChatDockMinimizedPill({
  title,
  initials,
  focused,
  pulsing,
  unread,
  onRestore,
  onClose,
}: {
  title: string;
  initials: string;
  focused?: boolean;
  pulsing?: boolean;
  unread?: boolean;
  onRestore: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={cn('chat-dock-pill', focused && 'is-focused', pulsing && 'is-pulsing')}
      data-dock-pill
    >
      <button
        type="button"
        className="chat-dock-pill-body"
        onClick={onRestore}
        title="Restore conversation"
      >
        <div className="chat-dock-pill-avatar">{initials}</div>
        <span className="chat-dock-pill-title">{title}</span>
        {unread ? <span className="chat-dock-pill-unread" aria-label="Unread" /> : null}
      </button>
      <button
        type="button"
        className="chat-dock-pill-close"
        aria-label="Close conversation"
        title="Close conversation"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
