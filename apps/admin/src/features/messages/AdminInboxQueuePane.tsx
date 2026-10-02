'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import { ErrorState, Skeleton, messagingPanelClass, cn } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

import { AdminConversationQueue } from './AdminConversationQueue';
import {
  conversationHref,
  conversationIsUnread,
  conversationKindKey,
  conversationKindLabel,
  conversationPreview,
  conversationTitle,
  resolveSelectedConversationId,
  sortConversations,
  type ConversationKindFilter,
  type QueueSort,
} from './conversation-utils';

export function AdminInboxQueuePane() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<ConversationKindFilter | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');
  const [inboxFilter, setInboxFilter] = useState<'active' | 'archived'>('active');
  const [queueSort, setQueueSort] = useState<QueueSort>('recent');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey:
      inboxFilter === 'active'
        ? queryKeys.messages.conversations
        : [...queryKeys.messages.conversations, 'archived'],
    queryFn: () =>
      apiServices.messaging.conversations(
        inboxFilter === 'active' ? undefined : { filter: 'archived' }
      ),
    staleTime: inboxFilter === 'active' ? 15_000 : 0,
  });

  const items = useMemo(() => (data?.items ?? []) as Conversation[], [data?.items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = items.filter((c) => {
      if (statusFilter === 'unread' && !conversationIsUnread(c)) return false;
      if (kindFilter !== 'all' && conversationKindKey(c) !== kindFilter) return false;
      if (!q) return true;
      const title = conversationTitle(c).toLowerCase();
      const preview = conversationPreview(c).toLowerCase();
      const kind = conversationKindLabel(c).toLowerCase();
      return (
        title.includes(q) ||
        preview.includes(q) ||
        kind.includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
    return sortConversations(matched, queueSort);
  }, [items, search, kindFilter, statusFilter, queueSort]);

  const selectedId = resolveSelectedConversationId(items, pathname);
  const unreadCount = items.filter((c) => conversationIsUnread(c)).length;

  return (
    <div className={cn(messagingPanelClass, 'inbox-queue-pane flex h-full min-h-0 flex-col')}>
      {isError ? (
        <div className="p-4">
          <ErrorState
            message={getApiErrorMessage(error, 'Could not load conversations')}
            onRetry={() => void refetch()}
          />
        </div>
      ) : null}

      {isPending ? (
        <div className="inbox-queue-list">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton
              key={i}
              className="h-[4.25rem] w-full rounded-none border-b border-border/40"
            />
          ))}
        </div>
      ) : null}

      {!isPending && !isError ? (
        <AdminConversationQueue
          mode="inline"
          rows={filtered}
          selectedId={selectedId}
          waitingCount={unreadCount}
          search={search}
          onSearchChange={setSearch}
          kindFilter={kindFilter}
          onKindFilterChange={setKindFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          queueSort={queueSort}
          onQueueSortChange={setQueueSort}
          inboxFilter={inboxFilter}
          onInboxFilterChange={setInboxFilter}
          onOpenRow={(row) => router.push(conversationHref(row))}
        />
      ) : null}
    </div>
  );
}
