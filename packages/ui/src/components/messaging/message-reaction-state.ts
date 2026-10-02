/** True when a message has been flagged for moderation review. */
export function isMessageFlagged(message: { reactions?: unknown }): boolean {
  const reactions = message.reactions;
  return (
    reactions !== null &&
    typeof reactions === 'object' &&
    !Array.isArray(reactions) &&
    (reactions as Record<string, unknown>).flagged === true
  );
}

/** True when a message is pinned in the conversation. */
export function isMessagePinned(message: { reactions?: unknown }): boolean {
  const reactions = message.reactions;
  return (
    reactions !== null &&
    typeof reactions === 'object' &&
    !Array.isArray(reactions) &&
    (reactions as Record<string, unknown>).pinned === true
  );
}
