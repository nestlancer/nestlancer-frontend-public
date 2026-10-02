import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { MessageAvatar } from './MessageAvatar';

export function MessageBubble({
  variant,
  senderLabel,
  showHeader,
  timeLabel,
  createdAt,
  pinned,
  readStatus,
  readLabel,
  quote,
  children,
  actions,
  below,
  density = 'default',
}: {
  variant: 'sent' | 'received';
  senderLabel: string;
  showHeader: boolean;
  timeLabel: string;
  createdAt?: string;
  pinned?: boolean;
  /** Shown on latest sent bubble: ✓ sent / ✓✓ read / partial for groups */
  readStatus?: 'sent' | 'read' | 'partial';
  readLabel?: string;
  /** Quoted parent preview shown above the message body */
  quote?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  below?: ReactNode;
  density?: 'default' | 'compact';
}) {
  const isSent = variant === 'sent';
  const compact = density === 'compact';

  return (
    <li
      className={cn(
        'msg-animate flex w-full',
        compact ? 'py-0.5' : 'py-1',
        isSent ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex gap-2',
          compact ? 'max-w-[85%]' : 'max-w-[min(100%,26rem)]',
          isSent ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {!compact && showHeader && !isSent ? (
          <MessageAvatar label={senderLabel} variant={variant} />
        ) : !compact && showHeader && isSent ? (
          <MessageAvatar label={senderLabel} variant={variant} />
        ) : !compact ? (
          <span className="w-8 shrink-0" aria-hidden />
        ) : null}

        <div className={cn('flex min-w-0 flex-col', isSent ? 'items-end' : 'items-start')}>
          {showHeader && !isSent ? (
            <p
              className={cn(
                'font-semibold text-foreground/80',
                compact ? 'mb-0.5 text-[10px]' : 'mb-1 text-[11px] font-bold'
              )}
            >
              {senderLabel}
            </p>
          ) : null}

          {pinned && showHeader ? (
            <span className="mb-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Pinned
            </span>
          ) : null}

          <div
            className={cn(
              isSent ? 'bubble-sent' : 'bubble-received',
              compact ? 'px-3 py-2 text-sm leading-relaxed' : 'px-4 py-2.5 text-sm leading-relaxed'
            )}
          >
            {quote ? <div className="msg-quote">{quote}</div> : null}
            {children}
            <div
              className={cn(
                'flex items-center gap-1',
                compact ? 'mt-0.5 text-[9px]' : 'mt-1 text-[10px]',
                isSent ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              <time dateTime={createdAt}>{timeLabel}</time>
              {readStatus && isSent ? (
                <span
                  className={cn(
                    'font-semibold tracking-tight',
                    readStatus === 'read'
                      ? 'text-primary-foreground/90'
                      : readStatus === 'partial'
                        ? 'text-primary-foreground/75'
                        : 'text-primary-foreground/55'
                  )}
                  aria-label={readLabel ?? (readStatus === 'read' ? 'Read' : 'Sent')}
                >
                  {readLabel ??
                    (readStatus === 'read' ? '✓✓' : readStatus === 'partial' ? '✓·' : '✓')}
                </span>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div
              className={cn(
                'mt-1.5 flex flex-wrap items-center gap-2',
                isSent ? 'justify-end' : 'justify-start'
              )}
            >
              {actions}
            </div>
          ) : null}

          {below}
        </div>
      </div>
    </li>
  );
}
