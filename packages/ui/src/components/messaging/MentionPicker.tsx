'use client';

import type { ChatThreadMember } from './messaging-types';
import { cn } from '../../utils/cn';
import { formatMemberMentionLabel } from './message-mentions';

export function MentionPicker({
  members,
  currentUserId,
  onPick,
  className,
}: {
  members: ChatThreadMember[];
  currentUserId?: string;
  onPick: (mentionText: string) => void;
  className?: string;
}) {
  const candidates = members.filter((m) => m.userId !== currentUserId);
  if (candidates.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {candidates.map((member) => {
        const label = formatMemberMentionLabel(member);
        return (
          <button
            key={member.userId}
            type="button"
            className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary"
            onClick={() => onPick(`@${label} `)}
          >
            @{label}
          </button>
        );
      })}
    </div>
  );
}
