export function readMentionUserIds(reactions: unknown): string[] {
  if (reactions === null || typeof reactions !== 'object' || Array.isArray(reactions)) return [];
  const mentions = (reactions as Record<string, unknown>).mentions;
  if (!Array.isArray(mentions)) return [];
  return mentions.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function formatMemberMentionLabel(member: {
  user: { firstName?: string | null; lastName?: string | null; email?: string | null };
}): string {
  const first = member.user.firstName?.trim() ?? '';
  const last = member.user.lastName?.trim() ?? '';
  const name = [first, last].filter(Boolean).join(' ').trim();
  return name || member.user.email?.trim() || 'Member';
}

export function insertMention(text: string, label: string): string {
  const mention = `@${label} `;
  return text.trimEnd() ? `${text.trimEnd()} ${mention}` : mention;
}

/** Split message content into text and @mention spans for rendering. */
export function splitMessageMentionParts(
  content: string,
  mentionLabels: string[]
): Array<{ type: 'text' | 'mention'; value: string }> {
  if (!content || mentionLabels.length === 0) return [{ type: 'text', value: content }];

  const sorted = [...mentionLabels].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `@(${sorted.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );

  const parts: Array<{ type: 'text' | 'mention'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mention', value: match[1] ?? '' });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: content }];
}
