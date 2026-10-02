'use client';

import Link from 'next/link';

import type { Conversation } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';
import { Button, cn, messagingKindBadgeClass, PeerViewStatusBadge } from '@nestlancer/ui';
import type { PeerViewState } from '@nestlancer/websocket';
import { formatRelativeTime } from '@nestlancer/utils';

import {
  conversationActivityAt,
  conversationIsUrgent,
  conversationIsUnread,
  conversationKindLabel,
  conversationPreview,
  conversationProjectId,
  conversationTitle,
  conversationWaitLabel,
} from './conversation-utils';
import { ClientGroupMembersPanel } from './ClientGroupMembersPanel';
import { ClientThreadActionsPanel } from './ClientThreadActionsPanel';
import { ConversationSearchSidebar } from './ConversationSearchSidebar';
import { isGroupConversation } from '@nestlancer/ui';

export function ClientMessagesContextRail({
  conversation,
  peerViewState,
  inlineMode = false,
  className,
}: {
  conversation: Conversation | null;
  peerViewState?: PeerViewState | null;
  inlineMode?: boolean;
  className?: string;
}) {
  const kind = conversation
    ? (conversationKindLabel(conversation) as keyof typeof messagingKindBadgeClass)
    : null;
  const activityAt = conversation ? conversationActivityAt(conversation) : undefined;
  const projectId = conversation ? conversationProjectId(conversation) : undefined;
  const unread = conversation ? conversationIsUnread(conversation) : false;
  const waitLabel = conversation ? conversationWaitLabel(conversation) : null;
  const urgent = conversation ? conversationIsUrgent(conversation) : false;
  const projectTitle = conversation?.title?.trim() || (projectId ? 'Linked project' : null);
  const projectStatus = conversation?.status?.trim();

  return (
    <aside className={cn('flex min-h-0 flex-col gap-3', className)}>
      {urgent && conversation ? (
        <div className="inbox-context-card border-destructive/30 bg-destructive/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">
            New reply
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">Waiting {waitLabel ?? '—'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unread support message —{' '}
            {inlineMode ? 'reply in the center panel.' : 'open the dock to read and reply.'}
          </p>
        </div>
      ) : null}

      <div className="inbox-context-card">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Focused conversation
        </p>
        <p
          className={cn(
            'mt-1 font-extrabold',
            conversation ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {conversation ? conversationTitle(conversation) : '—'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {conversation
            ? unread
              ? inlineMode
                ? 'Unread — reply below'
                : 'Unread in dock'
              : inlineMode
                ? 'Active thread'
                : 'Active in dock'
            : 'Select a conversation'}
        </p>
        {conversation ? (
          <div className="mt-2">
            <PeerViewStatusBadge state={peerViewState} perspective="client" />
          </div>
        ) : null}
      </div>

      <div className="inbox-context-card">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Thread
        </p>
        {conversation ? (
          <>
            <p className="mt-1 text-sm font-bold">{conversationTitle(conversation)}</p>
            {kind ? (
              <span
                className={cn(
                  'mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                  messagingKindBadgeClass[kind] ?? messagingKindBadgeClass.Direct
                )}
              >
                {kind}
              </span>
            ) : null}
            {unread && waitLabel ? (
              <p className="mt-2 text-xs font-semibold text-primary">Waiting {waitLabel}</p>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">—</p>
        )}
      </div>

      {projectId ? (
        <div className="inbox-context-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Project
          </p>
          <p className="mt-1 text-sm font-bold">{projectTitle ?? 'Linked project'}</p>
          {projectStatus ? (
            <p className="mt-1 text-xs text-muted-foreground">Status · {projectStatus}</p>
          ) : null}
          <Button size="sm" variant="outline" className="mt-3 h-8 w-full text-xs" asChild>
            <Link href={routes.project(projectId)}>Open project</Link>
          </Button>
        </div>
      ) : null}

      {conversation && isGroupConversation(conversation) && conversation.threadId ? (
        <ClientGroupMembersPanel threadId={conversation.threadId} title={conversation.title} />
      ) : null}

      {conversation?.kind === 'THREAD' && conversation.threadId ? (
        <ClientThreadActionsPanel
          threadId={conversation.threadId}
          threadLabel={isGroupConversation(conversation) ? 'group' : 'chat'}
        />
      ) : null}

      {conversation && (conversation.threadId || projectId) ? (
        <ConversationSearchSidebar
          threadId={conversation.threadId ?? undefined}
          projectId={projectId}
        />
      ) : null}

      <div className="inbox-context-card">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Latest
        </p>
        {conversation ? (
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <span className={unread ? 'text-primary' : 'text-muted-foreground/50'}>●</span>
              {activityAt ? `Activity ${formatRelativeTime(activityAt)}` : 'No recent activity'}
            </li>
            <li className="line-clamp-3 text-foreground/80">{conversationPreview(conversation)}</li>
          </ul>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            <li>No thread selected</li>
          </ul>
        )}
      </div>

      <div className="inbox-context-card mt-auto">
        <p className="text-xs font-semibold text-foreground">
          {inlineMode ? 'Inbox tips' : 'Dock tips'}
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          {inlineMode ? (
            <>
              <li>Select a queue row to focus the center chat panel</li>
              <li>New replies auto-select the conversation on this page</li>
              <li>Popup dock is available on other dashboard pages</li>
            </>
          ) : (
            <>
              <li>Click a queue row to pop a chat window</li>
              <li>New support replies appear as minimized pills</li>
              <li>
                <kbd className="rounded border border-border bg-background px-1">Esc</kbd> minimizes
                the focused window
              </li>
              <li>Stack up to 8 chats · close frees a slot</li>
            </>
          )}
        </ul>
      </div>
    </aside>
  );
}
