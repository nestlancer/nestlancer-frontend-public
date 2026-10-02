/** Matches backend `FileType` enum in media service. */
export type MediaFileType = 'IMAGE' | 'DOCUMENT' | 'ARCHIVE' | 'VIDEO';

const IMAGE_PREFIX = 'image/';
const VIDEO_PREFIX = 'video/';

const ARCHIVE_MIMES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/gzip',
]);

const ARCHIVE_EXTENSIONS = new Set(['zip', 'rar', 'gz', '7z', 'tar']);

/**
 * Map browser file metadata to API `fileType` for POST /media/upload/request.
 */
export function inferMediaFileType(mimeType: string, filename?: string): MediaFileType {
  const mime = mimeType.trim().toLowerCase();
  if (mime.startsWith(IMAGE_PREFIX)) return 'IMAGE';
  if (mime.startsWith(VIDEO_PREFIX)) return 'VIDEO';
  if (ARCHIVE_MIMES.has(mime)) return 'ARCHIVE';

  const ext = filename?.split('.').pop()?.toLowerCase();
  if (ext && ARCHIVE_EXTENSIONS.has(ext)) return 'ARCHIVE';

  return 'DOCUMENT';
}
