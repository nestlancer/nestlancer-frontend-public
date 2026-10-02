/** MIME types aligned with backend ALL_ALLOWED_MIME_TYPES (media uploads). */
export const ACCEPTED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/x-markdown',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'application/zip',
  'application/x-rar-compressed',
] as const;

/** Value for HTML file input `accept` attribute (includes .md for browsers that omit MIME). */
export const ACCEPTED_MEDIA_FILE_ACCEPT = [...ACCEPTED_MEDIA_MIME_TYPES, '.md', '.markdown'].join(
  ','
);
