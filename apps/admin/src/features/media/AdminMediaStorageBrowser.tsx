'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import {
  ACCEPTED_MEDIA_FILE_ACCEPT,
  getApiErrorMessage,
  type AdminMediaBrowseFolder,
} from '@nestlancer/api-client';
import { Button, Input, StatusBadge, cn } from '@nestlancer/ui';
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Plus,
  Search,
  Trash2,
  User,
} from '@nestlancer/ui/icons';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { AdminDataShell } from '@/components/admin/AdminPageChrome';
import { resolveMediaStatusVariant } from '@/lib/admin-status';
import { pickAdminPagination } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { AdminMediaDetailDrawer } from './AdminMediaDetailDrawer';
import { LazyMediaThumbnail, MimeIcon } from './LazyMediaThumbnail';
import {
  formatMediaBytes,
  inferFileTypeFromMime,
  parseAdminMediaRows,
  type AdminMediaRecord,
} from './types';

type StorageScope = {
  visibility?: 'PUBLIC' | 'PRIVATE';
  uploaderId?: string;
  fileType?: string;
  contextType?: string;
};

type ViewMode = 'grid' | 'list';

const STATUSES = ['', 'READY', 'PROCESSING', 'QUARANTINED', 'FAILED', 'UPLOADING'] as const;
const FILE_TYPES = ['', 'IMAGE', 'DOCUMENT', 'VIDEO', 'ARCHIVE'] as const;
const SOURCE_FILTERS = [
  { value: '', label: 'All sources' },
  { value: 'message', label: 'Message attachments' },
  { value: 'project', label: 'Projects' },
  { value: 'delivery', label: 'Deliveries' },
  { value: 'uploads', label: 'Uploads only' },
  { value: 'folder', label: 'Folders' },
] as const;
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'size:desc', label: 'Largest' },
  { value: 'filename:asc', label: 'Name A–Z' },
] as const;

function scopeFromParams(params: URLSearchParams): StorageScope {
  const visibility = params.get('visibility');
  const uploaderId = params.get('uploaderId') ?? undefined;
  // Deep-links that only pass uploaderId imply that user's private storage account.
  const resolvedVisibility =
    visibility === 'PUBLIC' || visibility === 'PRIVATE'
      ? visibility
      : uploaderId
        ? 'PRIVATE'
        : undefined;
  return {
    visibility: resolvedVisibility,
    uploaderId,
    fileType: params.get('fileType') ?? undefined,
    contextType: params.get('contextType') ?? undefined,
  };
}

type IssuedDocumentRow = {
  id: string;
  documentNumber: string;
  documentType: string;
  versionNumber: number;
  issuedAt?: string;
  requestId?: string | null;
  requestTitle?: string | null;
  projectTitle?: string | null;
  stageLabel?: string;
};

type IssuedDocumentGroup = {
  key: string;
  requestId: string | null;
  requestTitle: string;
  docs: IssuedDocumentRow[];
};

function asIssuedDocumentRows(data: unknown): IssuedDocumentRow[] {
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
      requestId: o.requestId != null ? String(o.requestId) : null,
      requestTitle: o.requestTitle != null ? String(o.requestTitle) : null,
      projectTitle: o.projectTitle != null ? String(o.projectTitle) : null,
      stageLabel: o.stageLabel != null ? String(o.stageLabel) : undefined,
    };
  });
}

function groupIssuedDocumentsByRequest(docs: IssuedDocumentRow[]): IssuedDocumentGroup[] {
  const order: string[] = [];
  const map = new Map<string, IssuedDocumentGroup>();
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

function FolderGlyph({ type }: { type: AdminMediaBrowseFolder['type'] }) {
  const className = 'h-5 w-5 text-primary';
  switch (type) {
    case 'bucket':
      return <HardDrive className={className} aria-hidden />;
    case 'user':
      return <User className={className} aria-hidden />;
    case 'category':
      return <FolderOpen className={className} aria-hidden />;
    case 'context':
      return <FileText className={className} aria-hidden />;
    default:
      return <FolderOpen className={className} aria-hidden />;
  }
}

export function AdminMediaStorageBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const uploadRef = useRef<HTMLInputElement>(null);

  const scope = useMemo(() => scopeFromParams(searchParams), [searchParams]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [privateExpanded, setPrivateExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [status, setStatus] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [forceFileView, setForceFileView] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUserSearch(userSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [userSearch]);

  // Deep-link / user folder: useEffect sets forceFileView when uploaderId is present.
  const showFiles =
    forceFileView || Boolean(scope.fileType || scope.contextType || debouncedSearch);

  useEffect(() => {
    const mediaId = searchParams.get('mediaId');
    if (mediaId) {
      setDrawerId(mediaId);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setSelectedIds(new Set());
    if (scope.uploaderId) {
      setForceFileView(true);
      setPrivateExpanded(true);
    } else if (!scope.fileType && !scope.contextType) {
      setForceFileView(false);
    }
  }, [scope.visibility, scope.uploaderId, scope.fileType, scope.contextType]);

  const navigate = useCallback(
    (next: StorageScope) => {
      const params = new URLSearchParams();
      if (next.visibility) params.set('visibility', next.visibility);
      if (next.uploaderId) params.set('uploaderId', next.uploaderId);
      if (next.fileType) params.set('fileType', next.fileType);
      if (next.contextType) params.set('contextType', next.contextType);
      const q = params.toString();
      router.push(q ? `/media?${q}` : '/media');
      setPage(1);
    },
    [router]
  );

  const browseQ = useQuery({
    queryKey: ['admin', 'media', 'browse', scope.visibility, scope.uploaderId],
    queryFn: () =>
      apiServices.mediaAdmin.browse({
        visibility: scope.visibility,
        uploaderId: scope.uploaderId,
      }),
    enabled: !debouncedSearch && !forceFileView,
  });

  useEffect(() => {
    // Stamp deliverable project context once the folder tree has loaded, and only
    // once per browser session. Starting it with the browse read held that read
    // behind the backfill write.
    if (!browseQ.isSuccess) return;
    const key = 'nl-admin-media-backfill';
    try {
      if (sessionStorage.getItem(key) === '1') return;
    } catch {
      // sessionStorage can be blocked; still attempt the backfill below.
    }
    const timer = window.setTimeout(() => {
      void apiServices.mediaAdmin
        .backfillContext()
        .then(() => {
          try {
            sessionStorage.setItem(key, '1');
          } catch {
            // ignore
          }
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [browseQ.isSuccess]);

  const effectiveFileType = scope.fileType || fileTypeFilter || undefined;

  const listQ = useQuery({
    queryKey: [
      'admin',
      'media',
      'list',
      scope,
      page,
      debouncedSearch,
      status,
      effectiveFileType,
      sort,
      forceFileView,
    ],
    queryFn: () =>
      apiServices.mediaAdmin.list({
        page,
        limit: viewMode === 'list' ? 30 : 24,
        search: debouncedSearch || undefined,
        visibility: scope.visibility,
        // User folder = full related inventory for that client (uploads + project/message/deliveries).
        relatedToUserId: scope.uploaderId || undefined,
        fileType: effectiveFileType,
        contextType: scope.contextType,
        status: status || undefined,
        sort,
        includeUrls: false,
      }),
    enabled: showFiles,
  });

  const privateUsersQ = useQuery({
    queryKey: ['admin', 'media', 'browse', 'PRIVATE', debouncedUserSearch],
    queryFn: () =>
      apiServices.mediaAdmin.browse({
        visibility: 'PRIVATE',
        search: debouncedUserSearch || undefined,
      }),
    staleTime: 60_000,
    enabled: privateExpanded || scope.visibility === 'PRIVATE' || Boolean(scope.uploaderId),
  });

  const userDocsQ = useQuery({
    queryKey: ['admin', 'documents', 'user', scope.uploaderId],
    queryFn: () =>
      apiServices.documents.listForUser(scope.uploaderId!, { limit: 50, latestOnly: true }),
    enabled: Boolean(scope.uploaderId),
    retry: false,
  });

  const downloadUserDocM = useMutation({
    mutationFn: (id: string) => apiServices.documents.getAdminDocumentDownloadUrl(id),
    onSuccess: (url) => {
      if (url) openSafeHttpUrl(url);
      else toast.error('Download URL unavailable');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not download document')),
  });

  const uploadM = useMutation({
    mutationFn: (file: File) =>
      apiServices.media.directUpload(file, { fileType: inferFileTypeFromMime(file.type) }),
    onSuccess: () => {
      toast.success('File uploaded');
      void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Upload failed')),
  });

  const bulkDeleteM = useMutation({
    mutationFn: ({ ids, force }: { ids: string[]; force?: boolean }) =>
      apiServices.mediaAdmin.bulkDelete(ids, force),
    onSuccess: () => {
      toast.success('Selected files deleted');
      setSelectedIds(new Set());
      void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Bulk delete failed')),
  });

  const rows = parseAdminMediaRows(listQ.data);
  const pagination = pickAdminPagination(listQ.data);
  const totalPages = pagination?.totalPages ?? 1;
  const folders = browseQ.data?.folders ?? [];
  const breadcrumbs = browseQ.data?.breadcrumbs ?? [{ id: 'root', label: 'Storage', path: '' }];
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  const openFolder = (folder: AdminMediaBrowseFolder) => {
    if (folder.type === 'bucket') {
      navigate({
        visibility: folder.id as 'PUBLIC' | 'PRIVATE',
      });
      return;
    }
    if (folder.type === 'user') {
      navigate({
        visibility: 'PRIVATE',
        uploaderId: folder.id,
      });
      return;
    }
    if (folder.type === 'category') {
      navigate({
        visibility: scope.visibility,
        uploaderId: scope.uploaderId,
        fileType: folder.fileType ?? folder.id,
      });
      return;
    }
    if (folder.type === 'context') {
      navigate({
        visibility: scope.visibility,
        uploaderId: scope.uploaderId,
        contextType: folder.contextType ?? folder.id,
      });
    }
  };

  const openDrawer = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(rows.map((row) => row.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { confirmed } = await confirm({
      title: 'Delete selected files',
      description: `Permanently delete ${ids.length} file(s)? Referenced files may require force delete.`,
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await bulkDeleteM.mutateAsync({ ids });
    } catch {
      const forcePass = await confirm({
        title: 'Force delete selected',
        description: 'Some files are referenced. Force delete all selected files anyway?',
        destructive: true,
        confirmLabel: 'Force delete',
      });
      if (forcePass.confirmed) {
        bulkDeleteM.mutate({ ids, force: true });
      }
    }
  };

  const scopeSummary = [
    scope.visibility === 'PUBLIC'
      ? 'Public library (published content)'
      : scope.visibility === 'PRIVATE'
        ? 'Private storage'
        : 'All buckets',
    scope.uploaderId ? 'Client library' : null,
    scope.fileType,
    scope.contextType,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex min-h-[560px] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 overflow-hidden rounded-xl border border-border bg-card lg:w-56">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <HardDrive className="h-3.5 w-3.5" aria-hidden />
          Browse
        </div>
        <nav className="space-y-0.5 p-2 text-sm">
          <SidebarItem
            active={!scope.visibility}
            label="All storage"
            icon={<HardDrive className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => navigate({})}
          />
          <SidebarItem
            active={scope.visibility === 'PUBLIC' && !scope.uploaderId}
            label="Public library"
            indent={1}
            icon={<ImageIcon className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => navigate({ visibility: 'PUBLIC' })}
          />
          <SidebarItem
            active={scope.visibility === 'PRIVATE' && !scope.uploaderId}
            label="Private"
            indent={1}
            expandable
            expanded={privateExpanded || scope.visibility === 'PRIVATE'}
            icon={<User className="h-3.5 w-3.5" aria-hidden />}
            onToggle={() => setPrivateExpanded((v) => !v)}
            onClick={() => {
              setPrivateExpanded(true);
              navigate({ visibility: 'PRIVATE' });
            }}
          />
          {privateExpanded || scope.visibility === 'PRIVATE' || scope.uploaderId ? (
            <div className="mt-2 border-t border-border pt-2">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                Users
              </p>
              <div className="px-2 pb-2">
                <Input
                  placeholder="Search name or email…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-8 text-xs"
                  aria-label="Search user storage accounts"
                />
              </div>
              {(privateUsersQ.data?.folders ?? []).slice(0, 50).map((user) => (
                <SidebarItem
                  key={user.id}
                  active={scope.uploaderId === user.id}
                  label={user.label}
                  indent={2}
                  suffix={String(user.count)}
                  onClick={() => navigate({ visibility: 'PRIVATE', uploaderId: user.id })}
                />
              ))}
              {privateUsersQ.isPending ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">Loading users…</p>
              ) : null}
              {!privateUsersQ.isPending && (privateUsersQ.data?.folders ?? []).length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {debouncedUserSearch
                    ? 'No users match that search.'
                    : 'No private uploaders yet.'}
                </p>
              ) : null}
            </div>
          ) : null}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted-foreground"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                {i > 0 ? <span className="opacity-40">/</span> : null}
                <button
                  type="button"
                  className="max-w-[160px] truncate rounded px-0.5 hover:text-primary hover:underline"
                  onClick={() => {
                    if (crumb.id === 'root') navigate({});
                    else if (crumb.id === 'PUBLIC') navigate({ visibility: 'PUBLIC' });
                    else if (crumb.id === 'PRIVATE') navigate({ visibility: 'PRIVATE' });
                    else if (scope.visibility && crumb.id === scope.uploaderId) {
                      navigate({ visibility: scope.visibility, uploaderId: scope.uploaderId });
                    }
                  }}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
            {scope.fileType ? (
              <>
                <span className="opacity-40">/</span>
                <span className="text-foreground">{scope.fileType}</span>
              </>
            ) : null}
            {scope.contextType ? (
              <>
                <span className="opacity-40">/</span>
                <span className="text-foreground">{scope.contextType}</span>
              </>
            ) : null}
          </nav>
          <p className="text-xs text-muted-foreground">{scopeSummary}</p>
        </div>

        {scope.visibility === 'PUBLIC' && !scope.uploaderId ? (
          <p className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Public library lists published blog/portfolio assets. Each card also shows the object
            file ACL — many published assets remain <span className="font-medium">PRIVATE</span> at
            the storage layer.
          </p>
        ) : null}

        <div
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
            if (file && !uploadM.isPending) uploadM.mutate(file);
          }}
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/80 bg-muted/15 hover:border-primary/40'
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                dragOver ? 'bg-primary/15 text-primary' : 'bg-background text-muted-foreground'
              )}
            >
              <Inbox className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {uploadM.isPending
                  ? 'Uploading…'
                  : dragOver
                    ? 'Drop file to upload'
                    : 'Drag & drop to upload'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Images, documents, video, and archives
              </p>
            </div>
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept={ACCEPTED_MEDIA_FILE_ACCEPT}
            className="hidden"
            aria-label="Upload file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadM.mutate(file);
              e.target.value = '';
            }}
          />
          <Button size="sm" disabled={uploadM.isPending} onClick={() => uploadRef.current?.click()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {uploadM.isPending ? 'Uploading…' : 'Browse files'}
          </Button>
        </div>

        <AdminDataShell
          filter={
            <div className="flex w-full flex-col gap-3">
              {!scope.fileType ? (
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  role="tablist"
                  aria-label="File type"
                >
                  {FILE_TYPES.map((t) => (
                    <button
                      key={t || 'all-types'}
                      type="button"
                      role="tab"
                      aria-selected={(fileTypeFilter || '') === t}
                      onClick={() => {
                        setFileTypeFilter(t);
                        setPage(1);
                        if (t) setForceFileView(true);
                      }}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                        (fileTypeFilter || '') === t
                          ? 'bg-foreground text-background'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {t || 'All types'}
                    </button>
                  ))}
                </div>
              ) : null}

              <div
                className="flex flex-wrap items-center gap-1.5"
                role="tablist"
                aria-label="Source"
              >
                {SOURCE_FILTERS.map((s) => (
                  <button
                    key={s.value || 'all-sources'}
                    type="button"
                    role="tab"
                    aria-selected={(scope.contextType || '') === s.value}
                    onClick={() => {
                      navigate({
                        visibility: scope.visibility,
                        uploaderId: scope.uploaderId,
                        fileType: scope.fileType,
                        contextType: s.value || undefined,
                      });
                      setForceFileView(true);
                    }}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                      (scope.contextType || '') === s.value
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 max-w-sm">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    placeholder="Search filename, mime, or ID…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Search files"
                    className="pl-8"
                  />
                </div>

                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                    setForceFileView(true);
                  }}
                  className="nl-select-filter rounded-md border border-input bg-background py-2 text-sm"
                  aria-label="Filter by status"
                >
                  {STATUSES.map((s) => (
                    <option key={s || 'all-status'} value={s}>
                      {s || 'All statuses'}
                    </option>
                  ))}
                </select>

                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                    setForceFileView(true);
                  }}
                  className="nl-select-filter rounded-md border border-input bg-background py-2 text-sm"
                  aria-label="Sort files"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="flex overflow-hidden rounded-md border border-border">
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

                {!showFiles ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForceFileView(true);
                      setPage(1);
                    }}
                  >
                    View all files
                  </Button>
                ) : forceFileView && !scope.fileType && !scope.contextType && !debouncedSearch ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForceFileView(false);
                      setStatus('');
                      setFileTypeFilter('');
                    }}
                  >
                    {scope.uploaderId ? 'Browse folders' : 'Back to folders'}
                  </Button>
                ) : null}
              </div>

              {selectedIds.size > 0 ? (
                <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-background/95 px-3 py-2 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <span className="font-medium">{selectedIds.size} selected</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={bulkDeleteM.isPending}
                    onClick={() => void handleBulkDelete()}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                    Clear
                  </Button>
                </div>
              ) : null}
            </div>
          }
          footer={
            showFiles && totalPages > 1 ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                  {pagination?.total != null ? ` · ${pagination.total} files` : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : undefined
          }
        >
          {!showFiles ? (
            <AdminQueryState isLoading={browseQ.isPending} error={browseQ.error}>
              {folders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/60" aria-hidden />
                  <p className="text-sm font-medium">This folder is empty</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a file or open another bucket from the sidebar.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {folders.map((folder) => (
                    <button
                      key={`${folder.type}-${folder.id}`}
                      type="button"
                      onClick={() => openFolder(folder)}
                      className="ge-card group flex flex-col items-start p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/20 hover:shadow-md"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-105">
                        <FolderGlyph type={folder.type} />
                      </span>
                      <span className="mt-3 font-medium">{folder.label}</span>
                      {folder.description ? (
                        <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {folder.description}
                        </span>
                      ) : null}
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {folder.count} files · {formatMediaBytes(folder.totalSize)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </AdminQueryState>
          ) : (
            <AdminQueryState isLoading={listQ.isPending} error={listQ.error}>
              {rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                  <Inbox className="h-8 w-8 text-muted-foreground/60" aria-hidden />
                  <p className="text-sm font-medium">No files match</p>
                  <p className="text-xs text-muted-foreground">
                    Adjust filters or upload a new file into this scope.
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {pagination?.total != null
                        ? `${pagination.total} file${pagination.total === 1 ? '' : 's'}`
                        : `${rows.length} on this page`}
                      {' · '}previews load as you scroll
                    </p>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all on page"
                      />
                      Select page
                    </label>
                  </div>
                  <div
                    className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    role="grid"
                    aria-label="Media files"
                  >
                    {rows.map((row) => (
                      <FileCard
                        key={row.id}
                        row={row}
                        libraryScope={scope.visibility}
                        selected={selectedIds.has(row.id)}
                        onToggle={() => toggleOne(row.id)}
                        onOpen={() => openDrawer(row.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            aria-label="Select all"
                            onChange={toggleAll}
                          />
                        </th>
                        <th className="px-3 py-2.5">File</th>
                        <th className="px-3 py-2.5">Uploader</th>
                        <th className="px-3 py-2.5">Type</th>
                        <th className="px-3 py-2.5">Size</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-muted/15">
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(row.id)}
                              aria-label={`Select ${row.filename}`}
                              onChange={() => toggleOne(row.id)}
                            />
                          </td>
                          <td className="max-w-[220px] px-3 py-2.5">
                            <button
                              type="button"
                              className="flex items-center gap-2 truncate text-left font-medium hover:underline"
                              onClick={() => openDrawer(row.id)}
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/30">
                                {row.mimeType.startsWith('image/') ? (
                                  <LazyMediaThumbnail
                                    mediaId={row.id}
                                    mimeType={row.mimeType}
                                    className="h-full w-full"
                                  />
                                ) : (
                                  <MimeIcon mimeType={row.mimeType} className="text-xs" />
                                )}
                              </span>
                              <span className="truncate">{row.filename}</span>
                            </button>
                          </td>
                          <td className="max-w-[140px] truncate px-3 py-2.5 text-muted-foreground">
                            {row.uploaderId ? (
                              <Link
                                href={`/users/${row.uploaderId}`}
                                className="hover:text-primary hover:underline"
                              >
                                {row.uploader?.displayName ?? row.uploaderId.slice(0, 8)}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{row.mimeType}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {formatMediaBytes(row.size)}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge variant={resolveMediaStatusVariant(row.status)} dot>
                              {row.status.replace(/_/g, ' ')}
                            </StatusBadge>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Button size="sm" variant="outline" onClick={() => openDrawer(row.id)}>
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminQueryState>
          )}
        </AdminDataShell>

        {scope.uploaderId ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Generated documents</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Versioned PDFs for this user, grouped by the request that produced them.
            </p>
            {userDocsQ.isPending ? (
              <p className="mt-3 text-xs text-muted-foreground">Loading documents…</p>
            ) : null}
            {userDocsQ.isError ? (
              <p className="mt-3 text-xs text-muted-foreground">Documents unavailable.</p>
            ) : null}
            {!userDocsQ.isPending && !userDocsQ.isError
              ? (() => {
                  const rows = asIssuedDocumentRows(userDocsQ.data);
                  const groups = groupIssuedDocumentsByRequest(rows);
                  if (rows.length === 0) {
                    return (
                      <p className="mt-3 text-xs text-muted-foreground">No generated documents.</p>
                    );
                  }
                  return (
                    <div className="mt-3 space-y-2">
                      {groups.map((group) => (
                        <details
                          key={group.key}
                          open={groups.length <= 3}
                          className="rounded-lg border border-border/80 open:bg-muted/20"
                        >
                          <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{group.requestTitle}</p>
                                <p className="text-xs text-muted-foreground">
                                  {group.requestId
                                    ? `Request · ${group.requestId.slice(0, 8)}`
                                    : 'Not tied to a request'}
                                  {` · ${group.docs.length} document${group.docs.length === 1 ? '' : 's'}`}
                                </p>
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
                                className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium">
                                    {doc.documentType} · {doc.documentNumber}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.stageLabel ? `${doc.stageLabel} · ` : ''}v
                                    {doc.versionNumber}
                                    {doc.issuedAt
                                      ? ` · ${new Date(doc.issuedAt).toLocaleDateString()}`
                                      : ''}
                                    {doc.projectTitle ? ` · ${doc.projectTitle}` : ''}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={downloadUserDocM.isPending}
                                  onClick={() => downloadUserDocM.mutate(doc.id)}
                                >
                                  Download
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ))}
                    </div>
                  );
                })()
              : null}
          </div>
        ) : null}
      </div>

      <AdminMediaDetailDrawer
        mediaId={drawerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDeleted={() => {
          setDrawerOpen(false);
          setDrawerId(null);
        }}
      />
    </div>
  );
}

const TREE_INDENT_CLASS = ['pl-2', 'pl-5', 'pl-8', 'pl-11', 'pl-14', 'pl-[68px]'] as const;

function treeIndentClass(indent = 0) {
  return TREE_INDENT_CLASS[Math.min(indent, TREE_INDENT_CLASS.length - 1)];
}

function SidebarItem({
  label,
  active,
  indent = 0,
  suffix,
  expandable,
  expanded,
  icon,
  onToggle,
  onClick,
}: {
  label: string;
  active?: boolean;
  indent?: number;
  suffix?: string;
  expandable?: boolean;
  expanded?: boolean;
  icon?: ReactNode;
  onToggle?: () => void;
  onClick: () => void;
}) {
  return (
    <div className={cn('flex items-center gap-0.5', treeIndentClass(indent))}>
      {expandable ? (
        <button
          type="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="rounded px-0.5 text-muted-foreground hover:bg-muted/50"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      ) : (
        <span className="w-4" />
      )}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
          active ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted/50'
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        {suffix ? (
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">{suffix}</span>
        ) : null}
      </button>
    </div>
  );
}

function formatMediaAclLabel(
  visibility: AdminMediaRecord['visibility'] | undefined,
  libraryScope?: 'PUBLIC' | 'PRIVATE'
): string {
  const acl = visibility ?? 'PRIVATE';
  if (libraryScope === 'PUBLIC' && acl === 'PRIVATE') {
    return 'Published asset · file ACL PRIVATE';
  }
  if (libraryScope === 'PUBLIC' && acl === 'PUBLIC') {
    return 'Public ACL';
  }
  return `File ACL ${acl}`;
}

function FileCard({
  row,
  libraryScope,
  selected,
  onToggle,
  onOpen,
}: {
  row: AdminMediaRecord;
  libraryScope?: 'PUBLIC' | 'PRIVATE';
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={cn(
        'ge-card group relative flex flex-col overflow-hidden transition-all hover:border-primary/40 hover:shadow-md',
        selected && 'border-primary/50 ring-2 ring-primary/25'
      )}
    >
      <label className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-background/95 shadow-sm">
        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select ${row.filename}`}
          onChange={onToggle}
        />
      </label>
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left">
        <div className="relative aspect-square w-full overflow-hidden bg-[linear-gradient(145deg,hsl(var(--muted)/0.55),hsl(var(--muted)/0.2))]">
          {row.mimeType.startsWith('image/') ? (
            <LazyMediaThumbnail
              mediaId={row.id}
              mimeType={row.mimeType}
              className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <MimeIcon mimeType={row.mimeType} className="h-full w-full" />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-2.5 pb-2 pt-8 opacity-95">
            <p className="truncate text-xs font-medium text-white">{row.filename}</p>
            <p className="truncate text-[10px] text-white/75">
              {formatMediaBytes(row.size)} · {formatMediaAclLabel(row.visibility, libraryScope)}
            </p>
          </div>
          <span className="absolute right-2 top-2">
            <StatusBadge variant={resolveMediaStatusVariant(row.status)} dot>
              {row.status.replace(/_/g, ' ')}
            </StatusBadge>
          </span>
        </div>
        {row.uploaderId ? (
          <div className="border-t border-border/60 px-2.5 py-1.5">
            <Link
              href={`/users/${row.uploaderId}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-[11px] text-muted-foreground hover:text-primary hover:underline"
            >
              {row.uploader?.displayName ?? row.uploaderId.slice(0, 8)}
            </Link>
          </div>
        ) : null}
      </button>
    </div>
  );
}
