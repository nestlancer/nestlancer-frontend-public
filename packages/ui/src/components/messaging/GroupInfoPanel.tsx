'use client';

import type { ReactNode } from 'react';

import type { ChatThreadMember } from './messaging-types';

import { cn } from '../../utils/cn';
import { Skeleton } from '../feedback/skeleton/Skeleton';
import { formatMemberName, memberInitials, resolveGroupThreadSubtitle } from './group-thread-utils';

export function GroupInfoPanel({
  members,
  isLoading,
  error,
  title,
  editableTitle,
  onTitleChange,
  onSaveTitle,
  saveTitlePending,
  manageSlot,
  memberActions,
  className,
}: {
  members: ChatThreadMember[];
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  editableTitle?: boolean;
  onTitleChange?: (value: string) => void;
  onSaveTitle?: () => void;
  saveTitlePending?: boolean;
  manageSlot?: ReactNode;
  memberActions?: (member: ChatThreadMember) => ReactNode;
  className?: string;
}) {
  const subtitle = resolveGroupThreadSubtitle(members.length);

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Group info
          </p>
          {editableTitle ? (
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
                value={title ?? ''}
                onChange={(e) => onTitleChange?.(e.target.value)}
                placeholder="e.g. Launch war room"
              />
              <button
                type="button"
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                disabled={saveTitlePending || !title?.trim()}
                onClick={() => onSaveTitle?.()}
              >
                Save
              </button>
            </div>
          ) : (
            <p className="mt-1 truncate text-sm font-bold text-foreground">{title ?? 'Group'}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {members.length > 0 ? (
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <div
                key={member.userId}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary"
                title={formatMemberName(member)}
              >
                {memberInitials(member)}
              </div>
            ))}
            {members.length > 4 ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
                +{members.length - 4}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {manageSlot ? <div className="mt-3">{manageSlot}</div> : null}

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Members
        </p>
        {isLoading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : error ? (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        ) : members.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No members found.</p>
        ) : (
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary">
                  {memberInitials(member)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {formatMemberName(member)}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {member.user.role === 'ADMIN' ? 'Admin' : 'Client'}
                    {member.user.email ? ` · ${member.user.email}` : ''}
                  </p>
                </div>
                {memberActions ? memberActions(member) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
