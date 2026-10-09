'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { resolveMessageUnreadCount } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import {
  Button,
  MessagingSplitWorkspace,
  MessagingWorkspaceChrome,
  MessagingWorkspaceEmpty,
  Skeleton,
  cn,
} from '@nestlancer/ui';
import { MessageSquare } from '@nestlancer/ui/icons';

import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

import { ClientInboxQueuePane } from './ClientInboxQueuePane';
import { conversationHref, conversationIsUnread, conversationKindKey } from './conversation-utils';
import { MessagingRealtimeStatus } from './MessagingRealtimeStatus';

/** Full messaging workspace panel (queue | thread | context). */
function MessagesPanelInner({ inbox = 'active' }: { inbox?: 'active' | 'archived' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedFromUrl = useRef(false);

  const { data, isPending } = useQuery({
    queryKey:
      inbox === 'active'
        ? queryKeys.messages.conversations
        : [...queryKeys.messages.conversations, 'archived'],
    queryFn: () =>
      apiServices.messaging.conversations(inbox === 'active' ? undefined : { filter: 'archived' }),
    staleTime: inbox === 'active' ? 15_000 : 0,
  });

  const unreadQ = useQuery({
    queryKey: queryKeys.messages.unread,
    queryFn: () => apiServices.messaging.unreadCount(),
    staleTime: 0,
  });

  const items = useMemo(() => (data?.items ?? []) as Conversation[], [data?.items]);

  useEffect(() => {
    document.body.classList.add('client-messages-inbox-page');
    return () => document.body.classList.remove('client-messages-inbox-page');
  }, []);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || openedFromUrl.current || isPending) return;
    const conv = items.find(
      (c) => c.id === openId || c.threadId === openId || c.projectId === openId
    );
    openedFromUrl.current = true;
    router.replace(conv ? conversationHref(conv) : routes.messageThread(openId));
  }, [searchParams, items, isPending, router]);

  const unreadCount = items.filter((c) => conversationIsUnread(c)).length;
  const totalUnread = resolveMessageUnreadCount(unreadQ.data);
  const projectCount = items.filter((c) => conversationKindKey(c) === 'project').length;
  const directCount = items.filter((c) => conversationKindKey(c) === 'direct').length;
  const groupCount = items.filter((c) => conversationKindKey(c) === 'group').length;
  const isArchived = inbox === 'archived';

  return (
    <MessagingWorkspaceChrome
      title={isArchived ? 'Archived messages' : 'Messaging panel'}
      description={
        isArchived
          ? 'Conversations you have archived — restore one from the queue to keep chatting.'
          : 'Your conversations with Nestlancer — pick a thread to continue.'
      }
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <MessagingRealtimeStatus />
          <Button size="sm" variant="outline" asChild>
            <Link href={isArchived ? routes.messagesInbox : routes.messages}>
              {isArchived ? 'Active inbox' : 'Overview'}
            </Link>
          </Button>
          <Button size="sm" className={webPrimaryButtonClass} asChild>
            <Link href={routes.messageNewDirect}>Message support</Link>
          </Button>
        </div>
      }
    >
      <MessagingSplitWorkspace
        queue={<ClientInboxQueuePane initialInbox={inbox} />}
        context={
          <div className="messaging-panel-elevated flex h-full min-h-0 flex-col gap-1.5 overflow-y-auto p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isArchived ? 'Archive snapshot' : 'Inbox snapshot'}
            </p>
            <InboxStatRow label={isArchived ? 'Archived' : 'Open'} value={items.length} />
            <InboxStatRow label="Unread" value={totalUnread} accent={totalUnread > 0} />
            <InboxStatRow label="Waiting" value={unreadCount} warn={unreadCount > 0} />
            <div className="mt-1.5 border-t border-border/50 pt-2">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                By type
              </p>
              <InboxStatRow label="Project" value={projectCount} muted />
              <InboxStatRow label="Direct" value={directCount} muted />
              <InboxStatRow label="Group" value={groupCount} muted />
            </div>
          </div>
        }
      >
        <MessagingWorkspaceEmpty
          title={isArchived ? 'Select an archived conversation' : 'Select a conversation'}
          description={
            isArchived
              ? 'Choose a thread from the archive list to review messages.'
              : 'Choose a thread from the list to read messages and send a reply.'
          }
          icon={<MessageSquare className="h-7 w-7" aria-hidden />}
        />
      </MessagingSplitWorkspace>
    </MessagingWorkspaceChrome>
  );
}

export function MessagesPanelClient({ inbox = 'active' }: { inbox?: 'active' | 'archived' }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <MessagesPanelInner inbox={inbox} />
    </Suspense>
  );
}

function InboxStatRow({
  label,
  value,
  accent,
  warn,
  muted,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={cn('text-sm', muted ? 'text-muted-foreground' : 'text-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'text-lg font-bold tabular-nums tracking-tight',
          accent && 'text-primary',
          warn && !accent && 'text-destructive',
          muted && 'text-muted-foreground'
        )}
      >
        {value}
      </span>
    </div>
  );
}
