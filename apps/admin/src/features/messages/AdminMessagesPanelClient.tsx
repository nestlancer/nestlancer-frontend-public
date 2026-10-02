'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { resolveMessageUnreadCount } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import {
  Button,
  MessagingSplitWorkspace,
  MessagingWorkspaceChrome,
  MessagingWorkspaceEmpty,
  cn,
} from '@nestlancer/ui';
import { MessageSquare } from '@nestlancer/ui/icons';

import { apiServices } from '@/lib/axios';

import { AdminInboxQueuePane } from './AdminInboxQueuePane';
import { conversationHref, conversationIsUnread, conversationKindKey } from './conversation-utils';

/** Full messaging workspace panel (queue | thread | context). */
export function AdminMessagesPanelClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedFromUrl = useRef(false);

  const { data, isPending } = useQuery({
    queryKey: queryKeys.messages.conversations,
    queryFn: () => apiServices.messaging.conversations(),
    staleTime: 15_000,
  });

  const unreadQ = useQuery({
    queryKey: queryKeys.messages.unread,
    queryFn: () => apiServices.messaging.unreadCount(),
    staleTime: 0,
  });

  const items = useMemo(() => (data?.items ?? []) as Conversation[], [data?.items]);

  useEffect(() => {
    document.body.classList.add('messages-inbox-page');
    return () => document.body.classList.remove('messages-inbox-page');
  }, []);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || openedFromUrl.current || isPending) return;
    const conv = items.find(
      (c) => c.id === openId || c.threadId === openId || c.projectId === openId
    );
    openedFromUrl.current = true;
    router.replace(
      conv ? conversationHref(conv) : `/messages/thread/${encodeURIComponent(openId)}`
    );
  }, [searchParams, items, isPending, router]);

  const unreadCount = items.filter((c) => conversationIsUnread(c)).length;
  const totalUnread = resolveMessageUnreadCount(unreadQ.data);
  const projectCount = items.filter((c) => conversationKindKey(c) === 'project').length;
  const directCount = items.filter((c) => conversationKindKey(c) === 'direct').length;
  const groupCount = items.filter((c) => conversationKindKey(c) === 'group').length;

  return (
    <MessagingWorkspaceChrome
      title="Messaging panel"
      description="Triage the queue, open a thread, and reply without leaving the workspace."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/messages">Overview</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/messages/new-direct">Message client</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/messages/new-group">New group</Link>
          </Button>
        </div>
      }
    >
      <MessagingSplitWorkspace
        queue={<AdminInboxQueuePane />}
        context={
          <div className="messaging-panel-elevated flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Inbox snapshot
            </p>
            <div className="ge-card space-y-1 rounded-lg border border-border bg-card p-3">
              <InboxStatRow label="Open" value={items.length} />
              <InboxStatRow label="Unread" value={totalUnread} accent={totalUnread > 0} />
              <InboxStatRow label="Waiting" value={unreadCount} warn={unreadCount > 0} />
            </div>
            <div className="ge-card space-y-1 rounded-lg border border-border bg-card p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
          title="Select a conversation"
          description="Pick a thread from the queue to read messages and reply as an operator."
          icon={<MessageSquare className="h-7 w-7" aria-hidden />}
        />
      </MessagingSplitWorkspace>
    </MessagingWorkspaceChrome>
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
