import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';

export const MODERATION_REMOVED_NOTICE = 'This flagged message was removed by moderation.';

export type MessageModerationVisual = {
  removed: boolean;
  censored: boolean;
};

export function getMessageModerationVisual(message: {
  reactions?: unknown;
  content?: string | null;
}): MessageModerationVisual {
  const reactions =
    message.reactions && typeof message.reactions === 'object' && !Array.isArray(message.reactions)
      ? (message.reactions as Record<string, unknown>)
      : {};
  const removed =
    reactions.moderationRemoved === true ||
    message.content === MODERATION_REMOVED_NOTICE ||
    message.content === 'This flagged message was removed by moderation.';
  const censored =
    !removed && (reactions.moderationCensored === true || reactions.escalated === true);
  return { removed, censored };
}

/** Renders removed notice or blurred/censored content for moderated chat bubbles. */
export function ModeratedMessageBody({
  message,
  children,
  className,
}: {
  message: { reactions?: unknown; content?: string | null };
  children: ReactNode;
  className?: string;
}) {
  const { removed, censored } = getMessageModerationVisual(message);

  if (removed) {
    return (
      <p className={cn('text-sm italic leading-relaxed text-muted-foreground', className)}>
        {MODERATION_REMOVED_NOTICE}
      </p>
    );
  }

  if (censored) {
    return (
      <div className={cn('relative', className)}>
        <div className="select-none blur-[6px] pointer-events-none" aria-hidden>
          {children}
        </div>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Hidden pending senior moderation review
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
