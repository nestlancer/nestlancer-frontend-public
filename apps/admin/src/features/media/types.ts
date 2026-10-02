import { pickAdminRecord, pickAdminRows } from '@/lib/admin-response';

export type AdminMediaUploader = {
  id: string;
  email?: string;
  displayName?: string;
};

export type AdminMediaUrls = {
  thumbnail?: string;
  preview?: string;
  download?: string;
  original?: string;
};

export type AdminMediaRecord = {
  id: string;
  filename: string;
  originalFilename?: string;
  mimeType: string;
  size: number;
  status: string;
  visibility?: string;
  uploaderId?: string;
  uploader?: AdminMediaUploader | null;
  contextType?: string | null;
  contextId?: string | null;
  urls?: AdminMediaUrls;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  virusInfo?: string;
  quarantineReason?: string;
  referenceCount?: number;
};

export type AdminMediaReference = {
  type: string;
  resourceId: string;
  label: string;
  adminPath: string;
};

export type AdminMediaShareLink = {
  id: string;
  token: string;
  purpose?: string | null;
  expiresAt?: string | null;
  passwordProtected?: boolean;
  createdAt?: string;
  shareUrl?: string;
};

export type AdminMediaReferencesPayload = {
  references: AdminMediaReference[];
  referenceCount: number;
};

export type AdminMediaMetadataPatch = {
  filename?: string;
  description?: string;
  customMetadata?: Record<string, string>;
  visibility?: 'PRIVATE' | 'PUBLIC';
  originalFilename?: string;
  metadataPatch?: Record<string, unknown>;
};

function readUrls(row: Record<string, unknown>): AdminMediaUrls | undefined {
  const urls =
    row.urls && typeof row.urls === 'object' ? (row.urls as Record<string, unknown>) : {};
  const thumbnail =
    typeof urls.thumbnail === 'string'
      ? urls.thumbnail
      : typeof urls.preview === 'string'
        ? urls.preview
        : undefined;
  const preview = typeof urls.preview === 'string' ? urls.preview : thumbnail;
  if (
    !thumbnail &&
    !preview &&
    typeof urls.download !== 'string' &&
    typeof urls.original !== 'string'
  ) {
    return undefined;
  }
  return {
    thumbnail,
    preview,
    download: typeof urls.download === 'string' ? urls.download : undefined,
    original: typeof urls.original === 'string' ? urls.original : undefined,
  };
}

function readUploader(row: Record<string, unknown>): AdminMediaUploader | null | undefined {
  const uploader = row.uploader;
  if (uploader && typeof uploader === 'object') {
    const u = uploader as Record<string, unknown>;
    return {
      id: String(u.id ?? row.uploaderId ?? ''),
      email: u.email != null ? String(u.email) : undefined,
      displayName:
        typeof u.displayName === 'string'
          ? u.displayName
          : [u.firstName, u.lastName].filter((x) => typeof x === 'string').join(' ') || undefined,
    };
  }
  if (row.uploaderId != null) {
    return { id: String(row.uploaderId) };
  }
  return undefined;
}

function readVirusInfo(metadata: Record<string, unknown> | undefined): {
  virusInfo?: string;
  quarantineReason?: string;
} {
  if (!metadata) return {};
  const scan =
    metadata.virusScan ?? metadata.scanResult ?? metadata.virusScanResult ?? metadata.malwareScan;
  const reason =
    metadata.quarantineReason ?? metadata.flagReason ?? metadata.threat ?? metadata.threats;
  return {
    virusInfo: scan != null ? String(scan) : undefined,
    quarantineReason: reason != null ? String(reason) : undefined,
  };
}

export function parseAdminMediaRecord(raw: unknown): AdminMediaRecord | null {
  const row = pickAdminRecord(raw);
  if (!row?.id) return null;

  const urls = readUrls(row);
  const metadata =
    row.metadata && typeof row.metadata === 'object'
      ? (row.metadata as Record<string, unknown>)
      : undefined;
  const virus = readVirusInfo(metadata);

  return {
    id: String(row.id),
    filename: String(row.filename ?? row.originalFilename ?? row.id),
    originalFilename: row.originalFilename != null ? String(row.originalFilename) : undefined,
    mimeType: String(row.mimeType ?? '—'),
    size: Number(row.size ?? row.fileSize ?? 0),
    status: String(row.status ?? 'UNKNOWN'),
    visibility: row.visibility != null ? String(row.visibility) : undefined,
    uploaderId: row.uploaderId != null ? String(row.uploaderId) : undefined,
    uploader: readUploader(row),
    contextType: row.contextType != null ? String(row.contextType) : null,
    contextId: row.contextId != null ? String(row.contextId) : null,
    urls,
    metadata,
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    thumbnailUrl: urls?.thumbnail ?? urls?.preview,
    previewUrl: urls?.preview ?? urls?.thumbnail ?? urls?.original,
    referenceCount:
      typeof row.referenceCount === 'number'
        ? row.referenceCount
        : typeof (row as { references?: { referenceCount?: number } }).references
              ?.referenceCount === 'number'
          ? (row as { references: { referenceCount: number } }).references.referenceCount
          : undefined,
    ...virus,
  };
}

export function parseAdminMediaRows(data: unknown): AdminMediaRecord[] {
  return pickAdminRows(data)
    .map((row) => parseAdminMediaRecord(row))
    .filter((row): row is AdminMediaRecord => row != null);
}

export function parseAdminMediaReferences(data: unknown): AdminMediaReferencesPayload {
  const record = pickAdminRecord(data) ?? {};
  const refs = Array.isArray(record.references)
    ? record.references
    : Array.isArray(data)
      ? data
      : [];
  const references = refs
    .map((item, i) => {
      const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      if (!o.resourceId && !o.label) return null;
      return {
        type: String(o.type ?? 'reference'),
        resourceId: String(o.resourceId ?? `ref-${i}`),
        label: String(o.label ?? o.type ?? 'Reference'),
        adminPath: String(o.adminPath ?? '/media'),
      } satisfies AdminMediaReference;
    })
    .filter((ref): ref is AdminMediaReference => ref != null);

  const referenceCount =
    typeof record.referenceCount === 'number' ? record.referenceCount : references.length;

  return { references, referenceCount };
}

export function parseAdminMediaShares(data: unknown): AdminMediaShareLink[] {
  const rows = pickAdminRows(data);
  return rows.map((row, i) => ({
    id: String(row.id ?? `share-${i}`),
    token: String(row.token ?? ''),
    purpose: typeof row.purpose === 'string' ? row.purpose : null,
    expiresAt: row.expiresAt != null ? String(row.expiresAt) : null,
    passwordProtected: Boolean(row.passwordHash ?? row.passwordProtected),
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    shareUrl: typeof row.shareUrl === 'string' ? row.shareUrl : undefined,
  }));
}

export function inferFileTypeFromMime(
  mimeType: string
): 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'ARCHIVE' {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (
    mime.includes('zip') ||
    mime.includes('archive') ||
    mime.includes('compressed') ||
    mime === 'application/x-rar-com'
  ) {
    return 'ARCHIVE';
  }
  return 'DOCUMENT';
}

export function formatMediaBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
