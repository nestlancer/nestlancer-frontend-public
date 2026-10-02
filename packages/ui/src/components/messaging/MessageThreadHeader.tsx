'use client';

import type { ReactNode } from 'react';

import { ArrowLeft } from '../../icons';
import { cn } from '../../utils/cn';
import { Button } from '../primitives/button/Button';
import { messageSenderInitials } from './message-time';

export function MessageThreadHeader({
  variant = 'aurora',
  title,
  subtitle,
  initials,
  online,
  onMarkRead,
  markReadPending,
  backHref,
  quickReplies,
  onQuickReply,
  actions,
}: {
  variant?: 'aurora' | 'intercom';
  title: string;
  subtitle?: string;
  initials?: string;
  online?: boolean;
  onMarkRead?: () => void;
  markReadPending?: boolean;
  backHref?: string;
  quickReplies?: string[];
  onQuickReply?: (text: string) => void;
  actions?: ReactNode;
}) {
  const avatarInitials = initials ?? messageSenderInitials(title);
  const isIntercom = variant === 'intercom';

  return (
    <div className={cn('shrink-0', isIntercom ? 'header-intercom' : 'header-aurora')}>
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        {backHref ? (
          <a
            href={backHref}
            aria-label="Back to inbox"
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md lg:hidden',
              isIntercom
                ? 'text-white/80 hover:bg-white/10 hover:text-white'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
        ) : null}

        <div className="relative shrink-0">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold',
              isIntercom
                ? 'bg-white/10 text-white ring-2 ring-white/20'
                : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary'
            )}
          >
            {avatarInitials}
          </div>
          {online ? (
            <span
              className={cn(
                'presence-online absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500',
                isIntercom && 'ring-white'
              )}
              aria-hidden
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate font-bold',
              isIntercom ? 'text-white' : 'text-foreground'
            )}
          >
            {title}
          </p>
          {subtitle ? (
            <p className={cn('truncate text-xs', isIntercom ? 'text-slate-300' : 'text-muted-foreground')}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions}
        {onMarkRead ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'shrink-0',
              isIntercom
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white'
                : 'border-border/80 bg-card/80 shadow-sm'
            )}
            disabled={markReadPending}
            onClick={() => onMarkRead()}
          >
            Mark read
          </Button>
        ) : null}
      </div>

      {quickReplies && quickReplies.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3.5 sm:px-5">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              className={cn(
                'chip-reply rounded-full px-3 py-1 text-[11px] font-semibold',
                isIntercom
                  ? 'chip-reply-intercom bg-white/10 text-white ring-1 ring-white/20'
                  : 'border border-border bg-card text-muted-foreground shadow-sm'
              )}
              onClick={() => onQuickReply?.(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
