'use client';

import { openSafeHttpUrl, safeNavigationUrl } from '@nestlancer/utils';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@nestlancer/ui';

import { ACCEPTED_MEDIA_FILE_ACCEPT, getApiErrorMessage } from '@nestlancer/api-client';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  PctProgressFill,
  SkeletonTable,
  cn,
} from '@nestlancer/ui';
import {
  ClipboardList,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from '@nestlancer/ui/icons';
import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { WebPanel } from '@/components/web/WebPanel';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { ShareMediaModal } from '@/features/media/components/ShareMediaModal';
import {
  FilePreviewDialog,
  type FilePreviewTarget,
} from '@/features/media/components/FilePreviewDialog';
import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

type MediaRow = {
  id: string;
  name: string;
  status?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  contextType?: string | null;
  contextId?: string | null;
  uploaderId?: string;
  canDelete?: boolean;
};

type SharedLinkRow = {
  id: string;
  mediaId: string;
  filename: string;
  purpose?: string | null;
  token: string;
  shareUrl?: string;
  expiresAt?: string | null;
  passwordProtected?: boolean;
};

type ViewMode = 'grid' | 'list';
type TypeFilter = 'all' | 'image' | 'document' | 'video' | 'archive';
type ContextFilter = 'all' | 'uploads' | 'message' | 'project' | 'delivery' | 'folder';

const FOLDER_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'documents', label: 'Documents' },
  { value: 'images', label: 'Images' },
] as const;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'video', label: 'Video' },
  { value: 'archive', label: 'Archives' },
];

const CONTEXT_FILTERS: { value: ContextFilter; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'uploads', label: 'My uploads' },
  { value: 'message', label: 'Message attachments' },
  { value: 'project', label: 'Projects' },
  { value: 'delivery', label: 'Deliveries' },
  { value: 'folder', label: 'Folders' },
];

const TYPE_TO_FILE_TYPE: Record<Exclude<TypeFilter, 'all'>, string> = {
  image: 'IMAGE',
  document: 'DOCUMENT',
  video: 'VIDEO',
  archive: 'ARCHIVE',
};

function asMediaRows(data: unknown): MediaRow[] {
  if (!data) return [];
  const raw = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: unknown[] }).data
      : Array.isArray((data as { items?: unknown[] }).items)
        ? (data as { items: unknown[] }).items
        : [];
  return raw.map((item, i) => {
    const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const urls = o.urls && typeof o.urls === 'object' ? (o.urls as Record<string, unknown>) : {};
    const thumbnailUrl =
      typeof urls.thumbnail === 'string'
        ? urls.thumbnail
        : typeof urls.preview === 'string'
          ? urls.preview
          : undefined;
    const previewUrl =
      typeof urls.preview === 'string'
        ? urls.preview
        : typeof urls.original === 'string'
          ? urls.original
          : typeof urls.thumbnail === 'string'
            ? urls.thumbnail
            : undefined;
    return {
      id: String(o.id ?? `media-${i}`),
      name: String(o.filename ?? o.originalFilename ?? o.name ?? o.id ?? 'File'),
      status: o.status != null ? String(o.status) : undefined,
      mimeType: o.mimeType != null ? String(o.mimeType) : undefined,
      size: typeof o.size === 'number' ? o.size : undefined,
      createdAt: o.createdAt != null ? String(o.createdAt) : undefined,
      thumbnailUrl,
      previewUrl,
      contextType: o.contextType != null ? String(o.contextType) : null,
      contextId: o.contextId != null ? String(o.contextId) : null,
      uploaderId: o.uploaderId != null ? String(o.uploaderId) : undefined,
      canDelete: o.canDelete === true || o.canDelete === 'true',
    };
  });
}

function asSharedRows(data: unknown): SharedLinkRow[] {
  if (!data) return [];
  const raw = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: unknown[] }).data
      : [];
  return raw.map((item, i) => {
    const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const media =
      o.media && typeof o.media === 'object' ? (o.media as Record<string, unknown>) : {};
    return {
      id: String(o.id ?? `share-${i}`),
      mediaId: String(media.id ?? o.mediaId ?? `share-${i}`),
      filename: String(media.filename ?? media.originalFilename ?? 'Shared file'),
      purpose: typeof o.purpose === 'string' ? o.purpose : null,
      token: String(o.token ?? ''),
      shareUrl: typeof o.shareUrl === 'string' ? o.shareUrl : undefined,
      expiresAt: o.expiresAt != null ? String(o.expiresAt) : null,
      passwordProtected: Boolean(o.passwordHash ?? o.passwordProtected),
    };
  });
}

type DocumentRow = {
  id: string;
  documentNumber: string;
  documentType: string;
  versionNumber: number;
  issuedAt?: string;
  fileSize?: number;
  isImmutable?: boolean;
  entityType?: string;
  requestId?: string | null;
  requestTitle?: string | null;
  projectId?: string | null;
  projectTitle?: string | null;
  stageLabel?: string;
};

type DocumentRequestGroup = {
  key: string;
  requestId: string | null;
  requestTitle: string;
  docs: DocumentRow[];
};

function asDocumentRows(data: unknown): DocumentRow[] {
  if (!data) return [];
  const raw = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: unknown[] }).data
      : [];
  return raw.map((item, i) => {
    const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    return {
      id: String(o.id ?? `doc-${i}`),
      documentNumber: String(o.documentNumber ?? '—'),
      documentType: String(o.documentType ?? 'DOCUMENT'),
      versionNumber: typeof o.versionNumber === 'number' ? o.versionNumber : 1,
      issuedAt: o.issuedAt != null ? String(o.issuedAt) : undefined,
      fileSize: typeof o.fileSize === 'number' ? o.fileSize : undefined,
      isImmutable: Boolean(o.isImmutable),
      entityType: o.entityType != null ? String(o.entityType) : undefined,
      requestId: o.requestId != null ? String(o.requestId) : null,
      requestTitle: o.requestTitle != null ? String(o.requestTitle) : null,
      projectId: o.projectId != null ? String(o.projectId) : null,
      projectTitle: o.projectTitle != null ? String(o.projectTitle) : null,
      stageLabel: o.stageLabel != null ? String(o.stageLabel) : undefined,
    };
  });
}

function groupDocumentsByRequest(docs: DocumentRow[]): DocumentRequestGroup[] {
  const order: string[] = [];
  const map = new Map<string, DocumentRequestGroup>();

  for (const doc of docs) {
    const key = doc.requestId ?? '__other__';
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        requestId: doc.requestId ?? null,
        requestTitle:
          doc.requestTitle?.trim() || (doc.requestId ? 'Untitled request' : 'Other documents'),
        docs: [],
      };
      map.set(key, group);
      order.push(key);
    }
    group.docs.push(doc);
  }

  return order.map((k) => map.get(k)!);
}

function parseStorageStats(data: unknown): { usedBytes: number; quotaBytes: number } | null {
  const o = data && typeof data === 'object' ? ((data as { data?: unknown }).data ?? data) : null;
  if (!o || typeof o !== 'object') return null;
  const r = o as Record<string, unknown>;
  const used = Number(r.totalUsedBytes ?? r.usedBytes ?? r.totalBytes ?? 0);
  const quota = Number(r.quotaBytes ?? r.limitBytes ?? 0);
  if (!Number.isFinite(used)) return null;
  return { usedBytes: used, quotaBytes: Number.isFinite(quota) ? quota : 0 };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function mimeKind(mimeType?: string): TypeFilter {
  if (!mimeType) return 'document';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('compressed') ||
    mimeType.includes('archive')
  ) {
    return 'archive';
  }
  return 'document';
}

function MimeGlyph({ mimeType, className }: { mimeType?: string; className?: string }) {
  const kind = mimeKind(mimeType);
  const cls = cn('h-6 w-6', className);
  if (kind === 'image') return <ImageIcon className={cn(cls, 'text-sky-600')} aria-hidden />;
  if (kind === 'archive') return <FileArchive className={cn(cls, 'text-amber-600')} aria-hidden />;
  if (kind === 'video') return <FileStackIcon className={cn(cls, 'text-violet-600')} />;
  return <FileText className={cn(cls, 'text-muted-foreground')} aria-hidden />;
}

/** Lightweight video glyph (no dedicated Video icon in the set). */
function FileStackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function statusTone(status?: string): string {
  switch (status) {
    case 'READY':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'PROCESSING':
    case 'UPLOADING':
    case 'PENDING':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    case 'FAILED':
    case 'QUARANTINED':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

export function MediaLibraryClient() {
  const confirm = useWebConfirm();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<MediaRow | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [contextFilter, setContextFilter] = useState<ContextFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moveTarget, setMoveTarget] = useState<MediaRow | null>(null);
  const [moveFolder, setMoveFolder] = useState('general');
  const [dragOver, setDragOver] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<FilePreviewTarget | null>(null);
  const pollingStartedAt = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {
      limit: 50,
      scope: 'library',
      // Opt-in URL signing — list metadata is cheap; signing every row does not scale.
      includeUrls: true,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;
    if (typeFilter !== 'all') params.fileType = TYPE_TO_FILE_TYPE[typeFilter];
    if (contextFilter === 'uploads') {
      params.contextType = 'uploads';
    } else if (contextFilter !== 'all') {
      params.contextType = contextFilter;
    }
    return params;
  }, [debouncedSearch, statusFilter, typeFilter, contextFilter]);

  const listQ = useQuery({
    queryKey: ['media', 'list', listParams],
    queryFn: () => apiServices.media.list(listParams),
  });

  const statsQ = useQuery({
    queryKey: ['media', 'storage-stats'],
    queryFn: () => apiServices.media.storageStats(),
  });

  const sharedQ = useQuery({
    queryKey: ['media', 'shared'],
    queryFn: () => apiServices.media.listShared(),
    retry: false,
  });

  const docsQ = useQuery({
    queryKey: ['documents', 'mine'],
    queryFn: () => apiServices.documents.listMine({ limit: 50, latestOnly: true }),
    retry: false,
  });

  const downloadDocM = useMutation({
    mutationFn: (id: string) => apiServices.documents.downloadMine(id),
    onSuccess: (url) => {
      if (url) openSafeHttpUrl(url);
      else toast.error('Download URL unavailable');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not download document')),
  });

  const statusQ = useQuery({
    queryKey: ['media', 'status', pollingId],
    queryFn: () => apiServices.media.getProcessingStatus(pollingId!),
    enabled: Boolean(pollingId),
    refetchInterval: (q) => {
      const s =
        q.state.data && typeof q.state.data === 'object'
          ? String((q.state.data as Record<string, unknown>).status ?? '')
          : '';
      return s === 'PROCESSING' || s === 'UPLOADING' || s === 'PENDING' ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!pollingId || !statusQ.data) return;
    const s =
      typeof statusQ.data === 'object'
        ? String((statusQ.data as Record<string, unknown>).status ?? '')
        : '';
    if (s === 'READY' || s === 'FAILED' || s === 'QUARANTINED') {
      setPollingId(null);
      pollingStartedAt.current = null;
      void qc.invalidateQueries({ queryKey: ['media', 'list'] });
      void qc.invalidateQueries({ queryKey: ['media', 'storage-stats'] });
      if (s === 'FAILED') {
        toast.error('File processing failed. Try uploading again or contact support.');
      } else if (s === 'QUARANTINED') {
        toast.error('File was quarantined by security scanning.');
      }
    }
  }, [pollingId, statusQ.data, qc]);

  useEffect(() => {
    if (!pollingId) {
      pollingStartedAt.current = null;
      return;
    }
    if (pollingStartedAt.current == null) {
      pollingStartedAt.current = Date.now();
    }
    const timer = window.setInterval(() => {
      const started = pollingStartedAt.current;
      if (started == null || Date.now() - started < PROCESSING_TIMEOUT_MS) return;
      setPollingId(null);
      pollingStartedAt.current = null;
      toast.error(
        'File processing is taking longer than expected. Refresh the list or try uploading again.'
      );
      void qc.invalidateQueries({ queryKey: ['media', 'list'] });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [pollingId, qc]);

  const { upload, isUploading } = useMediaUpload({
    onSuccess: (result) => {
      setUploadProgress(null);
      setPollingId(result.mediaId);
      void qc.invalidateQueries({ queryKey: ['media', 'list'] });
      void qc.invalidateQueries({ queryKey: ['media', 'storage-stats'] });
    },
  });

  const startUpload = useCallback(
    (file: File) => {
      setUploadProgress(0);
      upload({
        file,
        onProgress: (p) => setUploadProgress(p),
      });
    },
    [upload]
  );

  const downloadM = useMutation({
    mutationFn: (id: string) => apiServices.media.downloadUrl(id),
    onSuccess: (url) => {
      if (url) openSafeHttpUrl(url);
      else toast.error('Download URL not available');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Download failed')),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiServices.media.remove(id),
    onSuccess: () => {
      toast.success('File deleted');
      void qc.invalidateQueries({ queryKey: ['media', 'list'] });
      void qc.invalidateQueries({ queryKey: ['media', 'storage-stats'] });
      void qc.invalidateQueries({ queryKey: ['media', 'shared'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  });

  const copyM = useMutation({
    mutationFn: (id: string) => apiServices.media.copy(id),
    onSuccess: () => {
      toast.success('File copied');
      void qc.invalidateQueries({ queryKey: ['media', 'list'] });
      void qc.invalidateQueries({ queryKey: ['media', 'storage-stats'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Copy failed')),
  });

  const regenerateM = useMutation({
    mutationFn: (id: string) => apiServices.media.regenerateThumbnail(id),
    onSuccess: () => {
      toast.success('Thumbnail regeneration started');
      void qc.invalidateQueries({ queryKey: ['media', 'list'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not regenerate thumbnail')),
  });

  const moveM = useMutation({
    mutationFn: ({ id, destinationFolderId }: { id: string; destinationFolderId: string }) =>
      apiServices.media.move(id, { destinationFolderId }),
    onSuccess: () => {
      toast.success('File moved');
      setMoveTarget(null);
      void qc.invalidateQueries({ queryKey: ['media', 'list'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Move failed')),
  });

  const shareM = useMutation({
    mutationFn: ({
      id,
      purpose,
      expiresInSeconds,
      password,
    }: {
      id: string;
      purpose: string;
      expiresInSeconds: number;
      password?: string;
    }) =>
      apiServices.media.share(id, {
        purpose,
        expiresInSeconds,
        ...(password ? { password } : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['media', 'shared'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create share link')),
  });

  const revokeShareM = useMutation({
    mutationFn: ({ mediaId, shareLinkId }: { mediaId: string; shareLinkId: string }) =>
      apiServices.media.revokeShareById(mediaId, shareLinkId),
    onSuccess: () => {
      toast.success('Share link revoked');
      void qc.invalidateQueries({ queryKey: ['media', 'shared'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not revoke share link')),
  });

  const rows = useMemo(() => {
    const all = asMediaRows(listQ.data);
    // NL-DATA-002: collapse reseeded duplicates that share the same filename.
    const seen = new Set<string>();
    const deduped: MediaRow[] = [];
    for (const row of all) {
      const nameKey = row.name.trim().toLowerCase();
      if (nameKey && seen.has(nameKey)) continue;
      if (nameKey) seen.add(nameKey);
      deduped.push(row);
    }
    return deduped;
  }, [listQ.data]);

  const typeCounts = useMemo(() => {
    // Counts from current result set (server already filtered by type when applied).
    const all = rows;
    const counts: Record<TypeFilter, number> = {
      all: all.length,
      image: 0,
      document: 0,
      video: 0,
      archive: 0,
    };
    for (const row of all) {
      counts[mimeKind(row.mimeType)] += 1;
    }
    return counts;
  }, [rows]);

  const sharedRows = sharedQ.isError ? [] : asSharedRows(sharedQ.data);
  const documentRows = useMemo(() => asDocumentRows(docsQ.data), [docsQ.data]);
  const documentGroups = useMemo(() => groupDocumentsByRequest(documentRows), [documentRows]);
  const storage = parseStorageStats(statsQ.data);
  const usagePct =
    storage && storage.quotaBytes > 0
      ? Math.min(100, Math.round((storage.usedBytes / storage.quotaBytes) * 100))
      : 0;

  const handleShareSubmit = async (options: {
    purpose: string;
    expiresInSeconds: number;
    password?: string;
  }) => {
    if (!shareTarget) return null;
    const result = await shareM.mutateAsync({ id: shareTarget.id, ...options });
    const o = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
    const inner = o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : o;
    const shareUrl =
      inner.shareUrl != null
        ? String(inner.shareUrl)
        : inner.url != null
          ? String(inner.url)
          : undefined;
    return shareUrl ? { shareUrl } : null;
  };

  const isProcessing = (status?: string) =>
    status === 'PROCESSING' || status === 'UPLOADING' || status === 'PENDING';

  const handleDelete = async (m: MediaRow) => {
    if (m.canDelete === false) {
      toast.error('Only files you uploaded can be deleted from your library.');
      return;
    }
    const inUseHint =
      m.contextType === 'project'
        ? ' This file is linked to a project.'
        : m.contextType === 'message' || m.contextType === 'thread'
          ? ' This file was used in a message.'
          : '';
    if (
      await confirm({
        title: `Delete "${m.name}"?`,
        description: `This removes the file from storage and cannot be undone.${inUseHint}`,
        destructive: true,
      })
    ) {
      deleteM.mutate(m.id);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Your files library — uploads, message attachments, project files, and deliveries you can
          access. Storage quota counts only files you uploaded.
        </p>
        {storage ? (
          <div className="min-w-[200px] flex-1 max-w-xs">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-white/80">
                <HardDrive className="h-3.5 w-3.5 text-ta-brand-500" aria-hidden />
                Storage
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatBytes(storage.usedBytes)}
                {storage.quotaBytes > 0 ? ` / ${formatBytes(storage.quotaBytes)}` : ''}
              </span>
            </div>
            {storage.quotaBytes > 0 ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <PctProgressFill
                  pct={usagePct}
                  fillClassName={usagePct > 90 ? 'fill-destructive' : 'fill-ta-brand-500'}
                  className="h-full"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isUploading) fileInputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !isUploading) startUpload(file);
        }}
        onClick={() => {
          if (!isUploading) fileInputRef.current?.click();
        }}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all',
          dragOver
            ? 'border-ta-brand-500 bg-ta-brand-500/5 scale-[1.01]'
            : 'border-border bg-muted/20 hover:border-ta-brand-500/50 hover:bg-muted/35',
          isUploading && 'pointer-events-none opacity-80'
        )}
      >
        <span
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
            dragOver
              ? 'bg-ta-brand-500/15 text-ta-brand-600'
              : 'bg-background text-muted-foreground group-hover:text-ta-brand-600'
          )}
        >
          {isUploading || pollingId ? (
            <RefreshCw className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Inbox className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white/90">
            {isUploading
              ? `Uploading…${uploadProgress != null ? ` ${uploadProgress}%` : ''}`
              : pollingId
                ? 'Processing on server…'
                : dragOver
                  ? 'Drop to upload'
                  : 'Drag & drop a file here'}
          </p>
          <p className="text-xs text-muted-foreground">
            or click to browse · images, documents, archives · large files use chunked upload
          </p>
        </div>
        {(isUploading || pollingId) && (
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <PctProgressFill
              pct={isUploading ? (uploadProgress ?? 0) : 100}
              fillClassName="fill-ta-brand-500"
              className={cn('h-full', pollingId && !isUploading && 'animate-pulse')}
            />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MEDIA_FILE_ACCEPT}
          className="sr-only"
          disabled={isUploading}
          aria-label="Upload files"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) startUpload(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="File type"
          >
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={typeFilter === t.value}
                onClick={() => setTypeFilter(t.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  typeFilter === t.value
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {t.label}
                {!listQ.isPending && typeFilter === 'all' ? (
                  <span
                    className={cn(
                      'tabular-nums opacity-70',
                      typeFilter === t.value && 'opacity-90'
                    )}
                  >
                    {typeCounts[t.value]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Storage source"
          >
            {CONTEXT_FILTERS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={contextFilter === t.value}
                onClick={() => setContextFilter(t.value)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                  contextFilter === t.value
                    ? 'bg-ta-brand-500/15 text-ta-brand-700 dark:text-ta-brand-300'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1 sm:max-w-[220px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search files"
              className="w-full rounded-lg border border-input bg-background py-2 pl-8 pr-3 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="nl-select-filter rounded-lg border border-input bg-background py-2 text-sm"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="READY">Ready</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
            <option value="QUARANTINED">Quarantined</option>
          </select>
          <div className="flex overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={cn(
                'px-2.5 py-2 text-muted-foreground hover:bg-muted/50',
                viewMode === 'grid' && 'bg-primary/10 text-primary'
              )}
              onClick={() => setViewMode('grid')}
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={cn(
                'border-l border-border px-2.5 py-2 text-muted-foreground hover:bg-muted/50',
                viewMode === 'list' && 'bg-primary/10 text-primary'
              )}
              onClick={() => setViewMode('list')}
            >
              <ClipboardList className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="sm"
            className={webPrimaryButtonClass}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
            Upload
          </Button>
        </div>
      </div>

      {listQ.isPending ? <SkeletonTable rows={5} cols={1} /> : null}
      {listQ.isError ? (
        <ErrorState
          title="Could not load files"
          message={getApiErrorMessage(listQ.error)}
          onRetry={() => void listQ.refetch()}
        />
      ) : null}
      {!listQ.isPending && !listQ.isError && rows.length === 0 ? (
        <EmptyState
          variant="no-data"
          title={
            search || statusFilter || typeFilter !== 'all' || contextFilter !== 'all'
              ? 'No matching files'
              : 'No files yet'
          }
          description={
            search || statusFilter || typeFilter !== 'all' || contextFilter !== 'all'
              ? 'Try another filter or clear search.'
              : 'Upload a file, or open a project to receive deliveries and share message attachments.'
          }
        />
      ) : null}

      {!listQ.isPending && !listQ.isError && rows.length > 0 ? (
        viewMode === 'grid' ? (
          <div
            className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            role="grid"
            aria-label="Media library"
          >
            {rows.map((m) => (
              <article
                key={m.id}
                role="gridcell"
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/35 hover:shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[linear-gradient(145deg,hsl(var(--muted)/0.55),hsl(var(--muted)/0.2))]">
                  {safeNavigationUrl(m.thumbnailUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={safeNavigationUrl(m.thumbnailUrl) ?? undefined}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                      <MimeGlyph mimeType={m.mimeType} className="h-8 w-8" />
                      <span className="max-w-[80%] truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                        {m.mimeType?.split('/')[1] ?? 'file'}
                      </span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-3 pb-2.5 pt-10 opacity-90 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs font-medium text-white drop-shadow">{m.name}</p>
                    <p className="truncate text-[10px] text-white/75">
                      {[
                        m.size != null ? formatBytes(m.size) : null,
                        m.createdAt ? new Date(m.createdAt).toLocaleDateString() : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {m.status && m.status !== 'READY' ? (
                    <span
                      className={cn(
                        'absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm',
                        statusTone(m.status)
                      )}
                    >
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  ) : null}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    {m.status === 'READY' ? (
                      <button
                        type="button"
                        className="rounded-md bg-background/95 p-1.5 text-foreground shadow-sm hover:bg-background"
                        aria-label={`Preview ${m.name}`}
                        disabled={isProcessing(m.status)}
                        onClick={() =>
                          setPreviewTarget({
                            label: m.name,
                            url: m.previewUrl,
                            mediaId: m.id,
                            mimeType: m.mimeType,
                          })
                        }
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-md bg-background/95 p-1.5 text-foreground shadow-sm hover:bg-background"
                      aria-label={`Download ${m.name}`}
                      disabled={downloadM.isPending || isProcessing(m.status)}
                      onClick={() => downloadM.mutate(m.id)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <FileMoreMenu
                      m={m}
                      isProcessing={isProcessing}
                      sharePending={shareM.isPending}
                      copyPending={copyM.isPending}
                      regenPending={regenerateM.isPending}
                      movePending={moveM.isPending}
                      deletePending={deleteM.isPending}
                      onPreview={() =>
                        setPreviewTarget({
                          label: m.name,
                          url: m.previewUrl,
                          mediaId: m.id,
                          mimeType: m.mimeType,
                        })
                      }
                      onDownload={() => downloadM.mutate(m.id)}
                      onShare={() => setShareTarget(m)}
                      onCopy={() => copyM.mutate(m.id)}
                      onRegen={() => regenerateM.mutate(m.id)}
                      onMove={() => {
                        setMoveFolder('general');
                        setMoveTarget(m);
                      }}
                      onDelete={() => void handleDelete(m)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
            {rows.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30 sm:px-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                  {safeNavigationUrl(m.thumbnailUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={safeNavigationUrl(m.thumbnailUrl) ?? undefined}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <MimeGlyph mimeType={m.mimeType} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      m.status,
                      m.size != null ? formatBytes(m.size) : null,
                      m.mimeType,
                      m.createdAt ? new Date(m.createdAt).toLocaleDateString() : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {m.status === 'READY' ? (
                    <button
                      type="button"
                      className="rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                      disabled={isProcessing(m.status)}
                      onClick={() =>
                        setPreviewTarget({
                          label: m.name,
                          url: m.previewUrl,
                          mediaId: m.id,
                          mimeType: m.mimeType,
                        })
                      }
                    >
                      Preview
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                    disabled={downloadM.isPending || isProcessing(m.status)}
                    onClick={() => downloadM.mutate(m.id)}
                  >
                    Download
                  </button>
                  {m.status === 'READY' && m.canDelete !== false ? (
                    <button
                      type="button"
                      className="hidden rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-50 sm:inline-flex"
                      disabled={shareM.isPending}
                      onClick={() => setShareTarget(m)}
                    >
                      Share
                    </button>
                  ) : null}
                  <FileMoreMenu
                    m={m}
                    isProcessing={isProcessing}
                    sharePending={shareM.isPending}
                    copyPending={copyM.isPending}
                    regenPending={regenerateM.isPending}
                    movePending={moveM.isPending}
                    deletePending={deleteM.isPending}
                    onPreview={() =>
                      setPreviewTarget({
                        label: m.name,
                        url: m.previewUrl,
                        mediaId: m.id,
                        mimeType: m.mimeType,
                      })
                    }
                    onDownload={() => downloadM.mutate(m.id)}
                    onShare={() => setShareTarget(m)}
                    onCopy={() => copyM.mutate(m.id)}
                    onRegen={() => regenerateM.mutate(m.id)}
                    onMove={() => {
                      setMoveFolder('general');
                      setMoveTarget(m);
                    }}
                    onDelete={() => void handleDelete(m)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {documentRows.length > 0 ? (
        <WebPanel padding="md" className="mt-2">
          <h2 className="mb-1 text-sm font-semibold">Generated documents</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Quotes, invoices, and related PDFs grouped by the request that produced them.
          </p>
          <div className="space-y-2">
            {documentGroups.map((group) => (
              <details
                key={group.key}
                open={documentGroups.length <= 3}
                className="rounded-lg border border-border/80 bg-muted/10 open:bg-muted/20"
              >
                <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {group.requestTitle}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {group.requestId
                          ? `Request · ${group.requestId.slice(0, 8)}`
                          : 'Not tied to a request'}
                        {` · ${group.docs.length} document${group.docs.length === 1 ? '' : 's'}`}
                      </span>
                    </div>
                    {group.requestId ? (
                      <Link
                        href={`/requests/${encodeURIComponent(group.requestId)}`}
                        className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                </summary>
                <ul className="space-y-2 border-t border-border/60 px-3 py-2.5">
                  {group.docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/80 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="block truncate font-medium">
                          {doc.documentType} · {doc.documentNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.stageLabel ? `${doc.stageLabel} · ` : ''}v{doc.versionNumber}
                          {doc.isImmutable ? ' · locked' : ''}
                          {doc.fileSize != null ? ` · ${formatBytes(doc.fileSize)}` : ''}
                          {doc.issuedAt ? ` · ${new Date(doc.issuedAt).toLocaleDateString()}` : ''}
                          {doc.projectTitle ? ` · ${doc.projectTitle}` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                        disabled={downloadDocM.isPending}
                        onClick={() => downloadDocM.mutate(doc.id)}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </WebPanel>
      ) : null}

      {sharedRows.length > 0 ? (
        <WebPanel padding="md" className="mt-2">
          <h2 className="mb-1 text-sm font-semibold">Active share links</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Links you created for external access. Revoke anytime.
          </p>
          <ul className="space-y-2">
            {sharedRows.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium">{s.purpose || s.filename}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.passwordProtected ? 'Password protected · ' : ''}
                    {s.expiresAt
                      ? `Expires ${new Date(s.expiresAt).toLocaleString()}`
                      : 'No expiry'}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  {s.shareUrl || s.token ? (
                    <button
                      type="button"
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                      onClick={async () => {
                        const url = s.shareUrl || `${window.location.origin}/share/${s.token}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          toast.success('Share link copied');
                        } catch {
                          toast.error('Could not copy link');
                        }
                      }}
                    >
                      Copy link
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                    disabled={revokeShareM.isPending}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Revoke this share link?',
                          description: s.purpose ? `This will disable "${s.purpose}".` : undefined,
                          destructive: true,
                        })
                      ) {
                        revokeShareM.mutate({ mediaId: s.mediaId, shareLinkId: s.id });
                      }
                    }}
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </WebPanel>
      ) : null}

      {moveTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-file-title"
            className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-lg"
          >
            <h3 id="move-file-title" className="text-sm font-semibold">
              Move “{moveTarget.name}”
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Choose a destination folder.</p>
            <select
              className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={moveFolder}
              onChange={(e) => setMoveFolder(e.target.value)}
            >
              {FOLDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setMoveTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className={webPrimaryButtonClass}
                disabled={moveM.isPending}
                onClick={() => moveM.mutate({ id: moveTarget.id, destinationFolderId: moveFolder })}
              >
                {moveM.isPending ? 'Moving…' : 'Move'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ShareMediaModal
        open={Boolean(shareTarget)}
        filename={shareTarget?.name ?? ''}
        isSubmitting={shareM.isPending}
        onClose={() => setShareTarget(null)}
        onSubmit={handleShareSubmit}
      />

      <FilePreviewDialog
        open={previewTarget != null}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
        file={previewTarget}
      />
    </div>
  );
}

function FileMoreMenu({
  m,
  isProcessing,
  sharePending,
  copyPending,
  regenPending,
  movePending,
  deletePending,
  onPreview,
  onDownload,
  onShare,
  onCopy,
  onRegen,
  onMove,
  onDelete,
}: {
  m: MediaRow;
  isProcessing: (status?: string) => boolean;
  sharePending: boolean;
  copyPending: boolean;
  regenPending: boolean;
  movePending: boolean;
  deletePending: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
  onCopy: () => void;
  onRegen: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const isOwner = m.canDelete !== false;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`More actions for ${m.name}`}
          className="rounded-md border border-border bg-background/95 p-1.5 text-foreground shadow-sm hover:bg-background"
          onClick={(e) => e.stopPropagation()}
        >
          <Menu className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {m.status === 'READY' ? (
          <DropdownMenuItem className="cursor-pointer gap-2" onClick={onPreview}>
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className={cn(
            'cursor-pointer gap-2',
            isProcessing(m.status) && 'pointer-events-none opacity-50'
          )}
          onClick={() => {
            if (!isProcessing(m.status)) onDownload();
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </DropdownMenuItem>
        {isOwner && m.status === 'READY' ? (
          <DropdownMenuItem
            className={cn('cursor-pointer gap-2', sharePending && 'pointer-events-none opacity-50')}
            onClick={() => {
              if (!sharePending) onShare();
            }}
          >
            Share
          </DropdownMenuItem>
        ) : null}
        {isOwner && m.status === 'READY' ? (
          <DropdownMenuItem
            className={cn('cursor-pointer gap-2', copyPending && 'pointer-events-none opacity-50')}
            onClick={() => {
              if (!copyPending) onCopy();
            }}
          >
            Copy
          </DropdownMenuItem>
        ) : null}
        {isOwner && m.status === 'READY' ? (
          <DropdownMenuItem
            className={cn('cursor-pointer gap-2', movePending && 'pointer-events-none opacity-50')}
            onClick={() => {
              if (!movePending) onMove();
            }}
          >
            Move to folder
          </DropdownMenuItem>
        ) : null}
        {isOwner && m.thumbnailUrl ? (
          <DropdownMenuItem
            className={cn(
              'cursor-pointer gap-2',
              (regenPending || isProcessing(m.status)) && 'pointer-events-none opacity-50'
            )}
            onClick={() => {
              if (!regenPending && !isProcessing(m.status)) onRegen();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regen thumbnail
          </DropdownMenuItem>
        ) : null}
        {isOwner ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={cn(
                'cursor-pointer gap-2 text-destructive focus:text-destructive',
                deletePending && 'pointer-events-none opacity-50'
              )}
              onClick={() => {
                if (!deletePending) onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="pointer-events-none text-xs text-muted-foreground opacity-70">
              Shared with you · Nestlancer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
