export type FileMessagePayload = {
  mediaId: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  /** Optional note sent with the attachment (stored in FILE content JSON). */
  caption?: string;
};

/** Parse FILE message `content` JSON from the messaging API. */
export function parseFileMessageContent(
  content: string | null | undefined
): FileMessagePayload | null {
  if (!content?.trim()) return null;
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const mediaId = parsed.mediaId != null ? String(parsed.mediaId) : '';
    if (!mediaId) return null;
    const captionRaw = parsed.caption ?? parsed.note ?? parsed.description;
    return {
      mediaId,
      filename: parsed.filename != null ? String(parsed.filename) : undefined,
      mimeType: parsed.mimeType != null ? String(parsed.mimeType) : undefined,
      size: typeof parsed.size === 'number' ? parsed.size : undefined,
      caption: captionRaw != null ? String(captionRaw).trim() || undefined : undefined,
    };
  } catch {
    return null;
  }
}
