'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage, resolveMessageUnreadCount } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import {
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  cn,
  messagingConvItemActiveClass,
  messagingConvItemClass,
  messagingKindBadgeClass,
} from '@nestlancer/ui';
import { formatRelativeTime } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';

import { useClientChatDock } from './dock/ClientChatDockProvider';
import {
  conversationActivityAt,
  conversationHref,
  conversationInitials,
  conversationIsUnread,
  conversationKindKey,
  conversationKindLabel,
  conversationPreview,
  conversationTitle,
  type ConversationKindFilter,
} from './conversation-utils';

export { conversationHref };

const kindBadgeKey = {
  Direct: 'Direct',
  Project: 'Project',
  Group: 'Group',
} as const;

export function ConversationsListPanel({
  className,
  embedded,
  useDock,
}: {
  className?: string;
  embedded?: boolean;
  /** When true, rows open popup dock windows instead of navigating to a thread page. */
  useDock?: boolean;
}) {
  const pathname = usePathname();
  const dock = useClientChatDock();
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<ConversationKindFilter | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.messages.conversations,
    queryFn: () => apiServices.messaging.conversations(),
  });

  const unreadQ = useQuery({
    queryKey: queryKeys.messages.unread,
    queryFn: () => apiServices.messaging.unreadCount(),
    staleTime: 0,
  });

  const items = useMemo(() => (data?.items ?? []) as Conversation[], [data?.items]);
  const totalUnread = resolveMessageUnreadCount(unreadQ.data);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (statusFilter === 'unread' && !conversationIsUnread(c)) return false;
      if (kindFilter !== 'all' && conversationKindKey(c) !== kindFilter) return false;
      if (!q) return true;
      const title = conversationTitle(c).toLowerCase();
      const preview = conversationPreview(c).toLowerCase();
      return (
        title.includes(q) ||
        preview.includes(q) ||
        conversationKindLabel(c).toLowerCase().includes(q)
      );
    });
  }, [items, search, kindFilter, statusFilter]);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className={cn('space-y-3', embedded ? '' : 'mb-3')}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Inbox
          </span>
          {totalUnread > 0 ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {totalUnread} new
            </span>
          ) : null}
        </div>
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="h-10 rounded-xl border-border bg-muted/30 text-sm focus:border-primary/40 focus:bg-card focus:ring-primary/15"
          aria-label="Search conversations"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold',
              statusFilter === 'all' && kindFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted font-medium text-muted-foreground hover:bg-muted/80'
            )}
            onClick={() => {
              setStatusFilter('all');
              setKindFilter('all');
            }}
          >
            All
          </button>
          <button
            type="button"
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-medium',
              statusFilter === 'unread'
                ? 'bg-primary font-semibold text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            onClick={() => setStatusFilter(statusFilter === 'unread' ? 'all' : 'unread')}
          >
            Unread
          </button>
          <button
            type="button"
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-medium',
              kindFilter === 'project'
                ? 'bg-primary font-semibold text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            onClick={() => setKindFilter(kindFilter === 'project' ? 'all' : 'project')}
          >
            Project
          </button>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Could not load conversations"
          message={getApiErrorMessage(error, 'Could not load conversations')}
          onRetry={() => void refetch()}
        />
      ) : null}

      {isPending ? (
        <ul className="mt-2 space-y-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex gap-3 rounded-xl px-3 py-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!isPending && !isError && filtered.length === 0 ? (
        <EmptyState
          className="py-8"
          variant="no-data"
          title={items.length === 0 ? 'No conversations yet' : 'No matches'}
          description={
            items.length === 0
              ? 'Messages about your projects and direct chats with the team will appear here.'
              : 'Try a different search or filter.'
          }
        />
      ) : null}

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto p-1" aria-label="Conversations">
        {filtered.map((c) => {
          const href = conversationHref(c);
          const docked = useDock && dock.slots.has(c.id);
          const dockFocused = useDock && dock.focusedId === c.id;
          const dockMinimized = docked && dock.slots.get(c.id)?.minimized;
          const active = useDock ? dockFocused || docked : pathname === href;
          const unread = conversationIsUnread(c);
          const title = conversationTitle(c);
          const preview = conversationPreview(c);
          const activityAt = conversationActivityAt(c);
          const kind = conversationKindLabel(c) as keyof typeof kindBadgeKey;
          const initials = conversationInitials(c);

          const rowClass = cn(
            messagingConvItemClass,
            'w-full border-transparent text-left',
            active && messagingConvItemActiveClass,
            !active && unread && 'border-primary/15 bg-primary/[0.03]',
            docked && useDock && 'ring-1 ring-inset ring-primary/15'
          );

          const rowContent = (
            <>
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-extrabold',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : unread
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {initials}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm font-bold',
                      unread ? 'text-foreground' : 'text-foreground/90'
                    )}
                  >
                    {title}
                  </span>
                  {activityAt ? (
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {formatRelativeTime(activityAt)}
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'mt-0.5 inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                    messagingKindBadgeClass[kind] ?? messagingKindBadgeClass.Direct
                  )}
                >
                  {kind}
                </span>
                {preview ? (
                  <p
                    className={cn(
                      'mt-1 line-clamp-1 text-xs',
                      unread ? 'font-medium text-foreground/80' : 'text-muted-foreground'
                    )}
                  >
                    {preview}
                  </p>
                ) : null}
                {useDock ? (
                  <p className="mt-1 text-[10px] font-bold text-primary">
                    {docked ? (dockMinimized ? 'Minimized popup' : 'Popup open') : 'Open popup'}
                  </p>
                ) : null}
              </div>
              {unread ? (
                <span
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-sm shadow-primary/30"
                  aria-label="Unread conversation"
                />
              ) : null}
            </>
          );

          if (useDock) {
            return (
              <button
                key={c.id}
                type="button"
                className={rowClass}
                onClick={() => dock.openDock(c)}
              >
                {rowContent}
              </button>
            );
          }

          return (
            <Link key={c.id} href={href} className={rowClass}>
              {rowContent}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
