'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from '@nestlancer/ui/icons';

import { resolveMessageUnreadCount } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import { useAuth } from '@nestlancer/auth';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nestlancer/ui';
import { formatRelativeTime } from '@nestlancer/utils';

import {
  conversationHref,
  conversationIsUnread,
  conversationKindLabel,
  conversationPreview,
  conversationTitle,
  conversationActivityAt,
} from '@/features/messaging/conversation-utils';
import { apiServices } from '@/lib/axios';

const PREVIEW_LIMIT = 8;

function PreviewRow({ conversation }: { conversation: Conversation }) {
  const unread = conversationIsUnread(conversation);
  const href = conversationHref(conversation);
  const activityAt = conversationActivityAt(conversation);

  return (
    <DropdownMenuItem asChild className={cn('px-3 py-2.5', unread && 'bg-primary/[0.04]')}>
      <Link href={href}>
        <div className="flex w-full min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              unread ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn('truncate text-sm', unread && 'font-semibold')}>
                {conversationTitle(conversation)}
              </p>
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {conversationKindLabel(conversation)}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {conversationPreview(conversation)}
            </p>
          </div>
          {activityAt ? (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatRelativeTime(activityAt)}
            </span>
          ) : null}
        </div>
      </Link>
    </DropdownMenuItem>
  );
}

export function DashboardMessageLink({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();

  const unreadQ = useQuery({
    queryKey: queryKeys.messages.unread,
    queryFn: () => apiServices.messaging.unreadCount(),
    enabled: isAuthenticated,
    // staleTime:0 caused a fresh network round trip on every mount and every
    // window-focus event, including every navigation between dashboard pages.
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const previewQ = useQuery({
    // Same key and request as the chat dock, so one page load makes one call.
    // The menu still shows the first 8 of that list.
    queryKey: queryKeys.messages.conversations,
    queryFn: () => apiServices.messaging.conversations(),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const count = resolveMessageUnreadCount(unreadQ.data);
  const label = count > 0 ? `${count} unread messages` : 'Messages';
  const items = (previewQ.data?.items ?? []).slice(0, PREVIEW_LIMIT) as Conversation[];
  const viewAllHref = count > 0 ? routes.messages : routes.messages;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          title={label}
          onClick={() => {
            void Promise.all([unreadQ.refetch(), previewQ.refetch()]);
          }}
          className={cn(
            'relative h-10 w-10 shrink-0 rounded-xl text-muted-foreground transition-theme hover:bg-accent/80 hover:text-foreground data-[state=open]:bg-accent/80',
            className
          )}
        >
          <MessageSquare className="h-5 w-5" aria-hidden />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold leading-none text-primary-foreground shadow-sm">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Messages</p>
          {count > 0 ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {count} unread
            </span>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {previewQ.isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No conversations yet
            </p>
          ) : (
            items.map((conversation) => (
              <PreviewRow key={conversation.id} conversation={conversation} />
            ))
          )}
        </div>

        <div className="border-t border-border/60 p-2">
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href={viewAllHref} className="justify-center font-medium">
              Open message inbox
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
