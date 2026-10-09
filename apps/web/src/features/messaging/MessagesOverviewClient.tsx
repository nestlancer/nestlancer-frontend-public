'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage, resolveMessageUnreadCount } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import { Button, EmptyState, ErrorState, PageHeader, Skeleton, cn } from '@nestlancer/ui';
import { MessageSquare } from '@nestlancer/ui/icons';
import { formatRelativeTime } from '@nestlancer/utils';

import { ClientListPage } from '@/components/web/ClientListPage';
import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { webMetricStripClass, webPrimaryButtonClass } from '@/lib/tailadmin-classes';

import {
  conversationHref,
  conversationIsUnread,
  conversationKindLabel,
  conversationPreview,
  conversationTitle,
  sortConversations,
} from './conversation-utils';
import { MessagingRealtimeStatus } from './MessagingRealtimeStatus';

function MessagesOverviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedFromUrl = useRef(false);

  const { data, isPending, isError, error, refetch } = useQuery({
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
  const recent = useMemo(() => sortConversations(items, 'recent').slice(0, 8), [items]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || openedFromUrl.current || isPending) return;
    const conv = items.find(
      (c) => c.id === openId || c.threadId === openId || c.projectId === openId
    );
    openedFromUrl.current = true;
    router.replace(conv ? conversationHref(conv) : routes.messageThread(openId));
  }, [searchParams, items, isPending, router]);

  const unreadThreads = items.filter((c) => conversationIsUnread(c)).length;
  const totalUnread = resolveMessageUnreadCount(unreadQ.data);

  return (
    <ClientListPage>
      <PageHeader
        eyebrow="Support"
        title="Messages"
        description="Review your inbox at a glance, then open the messaging panel to chat."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <MessagingRealtimeStatus />
            <Button size="sm" variant="outline" asChild>
              <Link href={routes.messageNewDirect}>Message support</Link>
            </Button>
            <Button size="sm" className={webPrimaryButtonClass} asChild>
              <Link href={routes.messagesInbox}>Open messaging panel</Link>
            </Button>
          </div>
        }
      />

      <div className={cn(webMetricStripClass, 'sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3')}>
        <OverviewStripCell label="Open conversations" value={items.length} hint="Active threads" />
        <OverviewStripCell
          label="Unread messages"
          value={totalUnread}
          hint={
            totalUnread > 0
              ? unreadThreads > 0
                ? `${unreadThreads} threads waiting`
                : 'Unread waiting in inbox'
              : 'All caught up'
          }
          accent={totalUnread > 0}
        />
        <OverviewStripCell
          label="Unread threads"
          value={unreadThreads}
          hint={unreadThreads > 0 ? 'Needs a reply' : 'None waiting'}
          warn={unreadThreads > 0}
        />
      </div>

      <WebPanel className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent conversations</h2>
            <p className="text-xs text-muted-foreground">Latest activity in your inbox</p>
          </div>
          <Button size="sm" className={webPrimaryButtonClass} asChild>
            <Link href={routes.messagesInbox}>Open messaging panel</Link>
          </Button>
        </div>

        {isError ? (
          <div className="p-4">
            <ErrorState
              message={getApiErrorMessage(error, 'Could not load conversations')}
              onRetry={() => void refetch()}
            />
          </div>
        ) : null}

        {isPending ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-none border-b border-border/40" />
            ))}
          </div>
        ) : null}

        {!isPending && !isError && recent.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            title="No conversations yet"
            description="Message support to start a thread, then open the messaging panel to continue."
            action={
              <Button size="sm" className={webPrimaryButtonClass} asChild>
                <Link href={routes.messageNewDirect}>Message support</Link>
              </Button>
            }
          />
        ) : null}

        {!isPending && !isError && recent.length > 0 ? (
          <ul className="divide-y divide-border/50">
            {recent.map((row) => {
              const unread = conversationIsUnread(row);
              return (
                <li key={row.id}>
                  <Link
                    href={conversationHref(row)}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 sm:px-5"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                        unread ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                      aria-hidden
                    >
                      {conversationTitle(row).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'truncate text-sm',
                            unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                          )}
                        >
                          {conversationTitle(row)}
                        </span>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {conversationKindLabel(row)}
                        </span>
                        {unread ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                            aria-label="Unread"
                          />
                        ) : null}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {conversationPreview(row)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {row.lastMessageAt || row.latestMessage?.createdAt
                        ? formatRelativeTime(
                            String(row.lastMessageAt ?? row.latestMessage?.createdAt)
                          )
                        : '—'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </WebPanel>
    </ClientListPage>
  );
}

export function MessagesOverviewClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      }
    >
      <MessagesOverviewInner />
    </Suspense>
  );
}

function OverviewStripCell({
  label,
  value,
  hint,
  accent,
  warn,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-center px-3.5 py-2.5">
      <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white/90 sm:text-xl',
          accent && 'text-ta-brand-500',
          warn && !accent && 'text-destructive'
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>
    </div>
  );
}
