'use client';

import type { ChatThreadMember } from './messaging-types';
import { cn } from '../../utils/cn';
import { formatMemberMentionLabel, splitMessageMentionParts } from './message-mentions';

export function MessageMentionText({
  content,
  members,
  className,
}: {
  content: string;
  members?: ChatThreadMember[];
  className?: string;
}) {
  const labels = (members ?? []).map((m) => formatMemberMentionLabel(m));
  const parts = splitMessageMentionParts(content, labels);

  return (
    <p className={cn('whitespace-pre-wrap', className)}>
      {parts.map((part, index) =>
        part.type === 'mention' ? (
          <span
            key={`${part.value}-${index}`}
            className="rounded bg-primary/15 px-1 font-semibold text-primary"
          >
            @{part.value}
          </span>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        )
      )}
    </p>
  );
}
