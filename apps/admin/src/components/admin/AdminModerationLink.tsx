'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from '@nestlancer/ui/icons';

import { previewMessageContent } from '@nestlancer/api-client';
import { useAuth } from '@nestlancer/auth';
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nestlancer/ui';
import { formatRelativeTime } from '@nestlancer/utils';

import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination, pickAdminRows, rowId } from '@/lib/admin-response';
import { extractQueueCount } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

const PREVIEW_LIMIT = 8;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function personLabel(person: Record<string, unknown> | null): string {
  if (!person) return 'Unknown sender';
  const name = [person.firstName, person.lastName]
    .filter((x) => typeof x === 'string' && x.trim())
    .join(' ')
    .trim();
  return name || (typeof person.email === 'string' ? person.email : 'Unknown sender');
}

function chatKindLabel(row: Record<string, unknown>): string {
  const kind = String(row.chatKind ?? '').toLowerCase();
  if (kind === 'project') return 'Project';
  if (kind === 'group') return 'Group';
  if (kind === 'direct') return 'Direct';
  if (row.projectId) return 'Project';
  const thread = asRecord(row.thread);
  if (String(thread?.type ?? '').toUpperCase() === 'GROUP') return 'Group';
  return 'Direct';
}

function reviewLabel(row: Record<string, unknown>): string {
  if (String(row.reviewStatus ?? '').toLowerCase() === 'escalated') return 'Escalated';
  const reactions = asRecord(row.reactions);
  if (reactions?.escalated === true) return 'Escalated';
  return 'Flagged';
}

function PreviewRow({ row }: { row: Record<string, unknown> }) {
  const id = rowId(row);
  const sender = asRecord(row.sender);
  const project = asRecord(row.project);
  const thread = asRecord(row.thread);
  const threadId = typeof row.threadId === 'string' ? row.threadId : '';
  const projectId =
    typeof row.projectId === 'string'
      ? row.projectId
      : typeof project?.id === 'string'
        ? project.id
        : '';
  const href = threadId
    ? `/messages/thread/${encodeURIComponent(threadId)}`
    : projectId
      ? `/messages/project/${encodeURIComponent(projectId)}`
      : '/moderation';
  const preview = previewMessageContent({
    content: typeof row.content === 'string' ? row.content : null,
    type: typeof row.type === 'string' ? row.type : undefined,
  });
  const context =
    (typeof project?.title === 'string' && project.title) ||
    (typeof thread?.title === 'string' && thread.title) ||
    chatKindLabel(row);
  const createdAt = typeof row.createdAt === 'string' ? row.createdAt : undefined;
  const escalated = reviewLabel(row) === 'Escalated';

  return (
    <DropdownMenuItem asChild className="cursor-pointer px-3 py-2.5">
      <Link href={href}>
        <div className="flex w-full min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              escalated
                ? 'bg-destructive/15 text-destructive'
                : 'bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning))]'
            )}
          >
            <ShieldAlert className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{personLabel(sender)}</p>
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {chatKindLabel(row)}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{preview}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {reviewLabel(row)} · {context}
            </p>
          </div>
          {createdAt ? (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatRelativeTime(createdAt)}
            </span>
          ) : null}
        </div>
        <span className="sr-only">Open flagged message {id}</span>
      </Link>
    </DropdownMenuItem>
  );
}

export function AdminModerationLink({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();

  const flaggedQ = useQuery({
    queryKey: [...adminKeys.flaggedMessages(), 'header'],
    queryFn: () => apiServices.admin.getFlaggedMessages({ page: 1, limit: PREVIEW_LIMIT }),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const rows = pickAdminRows(flaggedQ.data);
  const count =
    pickAdminPagination(flaggedQ.data)?.total ?? extractQueueCount(flaggedQ.data) ?? rows.length;
  const label = count > 0 ? `${count} flagged messages awaiting review` : 'Moderation';
  const items = rows.slice(0, PREVIEW_LIMIT);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          onClick={() => {
            void flaggedQ.refetch();
          }}
          className={cn(
            'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-theme hover:bg-muted hover:text-foreground data-[state=open]:bg-muted',
            className
          )}
        >
          <ShieldAlert className="h-4 w-4" aria-hidden />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Moderation</p>
          {count > 0 ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              {count} queued
            </span>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {flaggedQ.isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No flagged messages right now
            </p>
          ) : (
            items.map((row) => (
              <PreviewRow
                key={rowId(row) || String(row.content ?? row.createdAt ?? Math.random())}
                row={row}
              />
            ))
          )}
        </div>

        <div className="border-t border-border/60 p-2">
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href="/moderation" className="justify-center font-medium">
              Open moderation queue
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
