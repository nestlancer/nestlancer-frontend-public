'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { ACCEPTED_MEDIA_FILE_ACCEPT, getApiErrorMessage } from '@nestlancer/api-client';
import { Button, Input, StatusBadge } from '@nestlancer/ui';
import { safeNavigationUrl } from '@nestlancer/utils';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { resolveMediaStatusVariant } from '@/lib/admin-status';
import { pickAdminPagination } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { AdminMediaDetailDrawer } from './AdminMediaDetailDrawer';
import {
  formatMediaBytes,
  inferFileTypeFromMime,
  parseAdminMediaRows,
  type AdminMediaRecord,
} from './types';

const STATUSES = ['', 'READY', 'PROCESSING', 'QUARANTINED', 'FAILED', 'UPLOADING'] as const;
const FILE_TYPES = ['', 'IMAGE', 'DOCUMENT', 'VIDEO', 'ARCHIVE'] as const;
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'size:desc', label: 'Largest first' },
  { value: 'filename:asc', label: 'Name A–Z' },
] as const;

export function AdminMediaAllFilesClient() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const { confirm } = useAdminConfirm();
  const uploadRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fileType, setFileType] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const uploaderId = searchParams.get('uploaderId') ?? '';

  useEffect(() => {
    const mediaId = searchParams.get('mediaId');
    if (mediaId) {
      setDrawerId(mediaId);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  const listQ = useQuery({
    queryKey: ['admin', 'media', 'all', page, search, status, fileType, sort, uploaderId],
    queryFn: () =>
      apiServices.mediaAdmin.list({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
        fileType: fileType || undefined,
        sort,
        uploaderId: uploaderId || undefined,
      }),
  });

  const uploadM = useMutation({
    mutationFn: (file: File) =>
      apiServices.media.directUpload(file, { fileType: inferFileTypeFromMime(file.type) }),
    onSuccess: () => {
      toast.success('File uploaded');
      void qc.invalidateQueries({ queryKey: ['admin', 'media', 'all'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Upload failed')),
  });

  const bulkDeleteM = useMutation({
    mutationFn: ({ ids, force }: { ids: string[]; force?: boolean }) =>
      apiServices.mediaAdmin.bulkDelete(ids, force),
    onSuccess: () => {
      toast.success('Selected files deleted');
      setSelectedIds(new Set());
      void qc.invalidateQueries({ queryKey: ['admin', 'media', 'all'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Bulk delete failed')),
  });

  const rows = parseAdminMediaRows(listQ.data);
  const pagination = pickAdminPagination(listQ.data);
  const totalPages = pagination?.totalPages ?? 1;
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

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

  const openDrawer = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
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

  return (
    <div className="space-y-4">
      {uploaderId ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <span>
            Filtered to uploader <span className="font-mono">{uploaderId}</span>
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href="/media">Clear filter</Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search files…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="nl-select-filter rounded-md border border-input bg-background py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s || 'all-status'} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>
        <select
          value={fileType}
          onChange={(e) => {
            setFileType(e.target.value);
            setPage(1);
          }}
          className="nl-select-filter rounded-md border border-input bg-background py-2 text-sm"
        >
          {FILE_TYPES.map((t) => (
            <option key={t || 'all-types'} value={t}>
              {t || 'All types'}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="nl-select-filter rounded-md border border-input bg-background py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          ref={uploadRef}
          type="file"
          accept={ACCEPTED_MEDIA_FILE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadM.mutate(file);
            e.target.value = '';
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={uploadM.isPending}
          onClick={() => uploadRef.current?.click()}
        >
          {uploadM.isPending ? 'Uploading…' : 'Upload file'}
        </Button>
        {selectedIds.size > 0 ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkDeleteM.isPending}
            onClick={() => void handleBulkDelete()}
          >
            Delete selected ({selectedIds.size})
          </Button>
        ) : null}
      </div>

      <AdminQueryState isLoading={listQ.isPending} error={listQ.error}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files found.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        aria-label="Select all"
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="px-3 py-3 text-left font-medium">Preview</th>
                    <th className="px-4 py-3 text-left font-medium">Filename</th>
                    <th className="px-4 py-3 text-left font-medium">Uploader</th>
                    <th className="px-4 py-3 text-left font-medium">Context</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Size</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Uploaded</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <MediaTableRow
                      key={row.id}
                      row={row}
                      selected={selectedIds.has(row.id)}
                      onToggle={() => toggleOne(row.id)}
                      onOpen={() => openDrawer(row.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
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
            )}
          </>
        )}
      </AdminQueryState>

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

function MediaTableRow({
  row,
  selected,
  onToggle,
  onOpen,
}: {
  row: AdminMediaRecord;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <tr className="hover:bg-muted/20">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select ${row.filename}`}
          onChange={onToggle}
        />
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={onOpen}
          className="block h-10 w-10 overflow-hidden rounded border border-border bg-muted/30"
        >
          {safeNavigationUrl(row.thumbnailUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeNavigationUrl(row.thumbnailUrl) ?? undefined}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              {row.mimeType.split('/')[0]?.slice(0, 3).toUpperCase() ?? 'FILE'}
            </span>
          )}
        </button>
      </td>
      <td className="max-w-[180px] px-4 py-3">
        <button type="button" className="truncate font-medium hover:underline" onClick={onOpen}>
          {row.filename}
        </button>
      </td>
      <td className="max-w-[160px] px-4 py-3 text-muted-foreground">
        {row.uploaderId ? (
          <Link
            href={`/users/${row.uploaderId}`}
            className="truncate hover:text-primary hover:underline"
          >
            {row.uploader?.displayName ?? row.uploader?.email ?? row.uploaderId.slice(0, 8)}
          </Link>
        ) : (
          '—'
        )}
      </td>
      <td className="max-w-[140px] truncate px-4 py-3 text-muted-foreground">
        {row.contextType
          ? `${row.contextType}${row.contextId ? `: ${row.contextId.slice(0, 8)}…` : ''}`
          : '—'}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{row.mimeType}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatMediaBytes(row.size)}</td>
      <td className="px-4 py-3">
        <StatusBadge variant={resolveMediaStatusVariant(row.status)} dot>
          {row.status.replace(/_/g, ' ')}
        </StatusBadge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="outline" onClick={onOpen}>
          Details
        </Button>
      </td>
    </tr>
  );
}
