'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import type { Conversation } from '@nestlancer/types';
import {
  Button,
  CHAT_DOCK_MAX_SLOTS,
  CHAT_DOCK_SHORTCUTS,
  cn,
  messagingKindBadgeClass,
  PeerViewStatusBadge,
  Skeleton,
} from '@nestlancer/ui';
import type { PeerViewState } from '@nestlancer/websocket';
import { formatRelativeTime } from '@nestlancer/utils';

import { adminKeys } from '@/lib/admin-query-keys';
import { clientEmailFromRow, formatAdminStatus, pickAdminRecord } from '@/lib/admin-response';
import { rowUserId } from '@/lib/admin-pipeline-hub';
import { apiServices } from '@/lib/axios';

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
import { AdminGroupMembersPanel } from './AdminGroupMembersPanel';
import { AdminThreadActionsPanel } from './AdminThreadActionsPanel';
import { ConversationSearchSidebar } from './ConversationSearchSidebar';
import { isGroupConversation } from '@nestlancer/ui';

export function AdminMessagesContextRail({
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

  const projectQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId],
    queryFn: () => apiServices.admin.getAdminProject(projectId!),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  });

  const project = pickAdminRecord(projectQ.data);
  const clientEmail = project ? clientEmailFromRow(project) : null;
  const clientUserId = project ? rowUserId(project) : undefined;
  const projectStatus = project ? formatAdminStatus(project.status) : null;
  const projectTitle =
    project && typeof project.title === 'string' && project.title.trim()
      ? project.title.trim()
      : null;

  return (
    <aside className={cn('flex min-h-0 flex-col gap-3', className)}>
      {urgent && conversation ? (
        <div className="inbox-context-card border-destructive/30 bg-destructive/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">
            Needs response
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">Waiting {waitLabel ?? '—'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Client message unread —{' '}
            {inlineMode ? 'reply below to clear.' : 'reply in the dock to clear.'}
          </p>
        </div>
      ) : null}

      <div className="inbox-context-card">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Focused client
        </p>
        <p
          className={cn(
            'mt-1 font-extrabold',
            conversation ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {conversation ? conversationTitle(conversation) : '—'}
        </p>
        {clientEmail && clientEmail !== '—' ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">{clientEmail}</p>
        ) : (
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
        )}
        {conversation ? (
          <div className="mt-2">
            <PeerViewStatusBadge state={peerViewState} perspective="admin" />
          </div>
        ) : null}
        {clientUserId ? (
          <Button size="sm" variant="outline" className="mt-3 h-8 w-full text-xs" asChild>
            <Link href={`/users/${clientUserId}`}>Open client profile</Link>
          </Button>
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
          {projectQ.isPending ? (
            <Skeleton className="mt-2 h-12 w-full rounded-lg" />
          ) : project ? (
            <>
              <p className="mt-1 text-sm font-bold">{projectTitle ?? 'Linked project'}</p>
              {projectStatus ? (
                <p className="mt-1 text-xs text-muted-foreground">Status · {projectStatus}</p>
              ) : null}
              <Button size="sm" variant="outline" className="mt-3 h-8 w-full text-xs" asChild>
                <Link href={`/projects/${projectId}`}>Open project</Link>
              </Button>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Could not load project details.</p>
          )}
        </div>
      ) : null}

      {conversation && isGroupConversation(conversation) && conversation.threadId ? (
        <AdminGroupMembersPanel threadId={conversation.threadId} />
      ) : null}

      {conversation?.kind === 'THREAD' &&
      conversation.threadId &&
      !isGroupConversation(conversation) ? (
        <AdminThreadActionsPanel threadId={conversation.threadId} threadLabel="chat" />
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
        <p className="inbox-context-label">Keyboard shortcuts</p>
        <ul className="inbox-context-shortcuts">
          {CHAT_DOCK_SHORTCUTS.slice(0, 4).map((item) => (
            <li key={item.keys}>
              <kbd>{item.keys}</kbd>
              <span>{item.description}</span>
            </li>
          ))}
          <li className="inbox-context-shortcuts-note">
            {inlineMode
              ? 'Inline chat on this page · dock available on other console routes'
              : `Up to ${CHAT_DOCK_MAX_SLOTS} docked chats · press `}
            {!inlineMode ? <kbd>?</kbd> : null}
            {!inlineMode ? ' for all shortcuts' : null}
          </li>
        </ul>
      </div>
    </aside>
  );
}
