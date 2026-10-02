/** MIME types allowed for project request attachments (aligned with backend REQUEST_ATTACHMENT_MIME_TYPES). */
export const ACCEPTED_REQUEST_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/x-markdown',
] as const;

export const ACCEPTED_REQUEST_ATTACHMENT_ACCEPT = [
  ...ACCEPTED_REQUEST_ATTACHMENT_MIME_TYPES,
  '.md',
  '.markdown',
  '.doc',
  '.docx',
].join(',');
