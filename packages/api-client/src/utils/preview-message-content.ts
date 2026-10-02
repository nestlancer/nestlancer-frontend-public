import { parseFileMessageContent } from './parse-file-message';

/** Short plain-text preview for reply quotes / inbox snippets. */
export function previewMessageContent(
  message: { content?: string | null; type?: string | null } | null | undefined,
  maxLen = 140
): string {
  if (!message) return 'Message';
  if (message.type === 'FILE') {
    const payload = parseFileMessageContent(message.content);
    const text = payload?.caption?.trim() || payload?.filename?.trim() || 'Attachment';
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  }
  const text = (message.content ?? '').trim() || 'Message';
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
