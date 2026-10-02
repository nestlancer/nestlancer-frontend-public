'use client';

import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';

/**
 * Full-page messaging shell: conversation queue | thread | optional context rail.
 * Matches Slack / Intercom / mail-client spatial permanence (each pane scrolls alone).
 */
export function MessagingSplitWorkspace({
  queue,
  children,
  context,
  className,
}: {
  queue: ReactNode;
  children: ReactNode;
  context?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('inbox-split-layout', className)}>
      <div className={cn('inbox-split-panel', 'inbox-queue-pane')}>{queue}</div>
      <div className={cn('inbox-split-panel', 'inbox-split-panel--chat')}>{children}</div>
      {context ? <aside className="inbox-context-rail">{context}</aside> : null}
    </div>
  );
}

export function MessagingWorkspaceEmpty({
  title = 'Select a conversation',
  description = 'Choose a thread from the queue to read and reply.',
  icon,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="inbox-inline-empty messaging-panel-elevated inbox-inline-chat">
      {icon ? (
        <div className="inbox-inline-empty-icon" aria-hidden>
          {icon}
        </div>
      ) : (
        <div className="inbox-inline-empty-icon" aria-hidden>
          ▢
        </div>
      )}
      <p className="inbox-inline-empty-title">{title}</p>
      <p className="inbox-inline-empty-desc">{description}</p>
    </div>
  );
}

export function MessagingWorkspaceChrome({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('messages-inbox-shell messages-workspace-shell', className)}>
      <header className="messages-workspace-chrome">
        <div className="min-w-0 flex-1">
          <h1 className="messages-workspace-title">{title}</h1>
          {description ? <p className="messages-workspace-desc">{description}</p> : null}
        </div>
        {actions ? <div className="messages-workspace-actions">{actions}</div> : null}
      </header>
      <div className="messages-command-center messages-workspace-body">{children}</div>
    </div>
  );
}
