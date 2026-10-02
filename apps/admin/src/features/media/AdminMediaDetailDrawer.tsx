'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from '@nestlancer/ui';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Input,
  StatusBadge,
} from '@nestlancer/ui';
import { safeNavigationUrl } from '@nestlancer/utils';

import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { resolveMediaStatusVariant } from '@/lib/admin-status';

import { AdminMediaCreateShareDialog } from './AdminMediaCreateShareDialog';
import { AdminMediaReferencesList } from './AdminMediaReferencesList';
import { AdminMediaReplaceDialog } from './AdminMediaReplaceDialog';
import { useAdminMediaDetail } from './hooks/useAdminMediaDetail';
import { formatMediaBytes } from './types';

export function AdminMediaDetailDrawer({
  mediaId,
  open,
  onOpenChange,
  variant = 'default',
  onDeleted,
}: {
  mediaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'default' | 'quarantine';
  onDeleted?: () => void;
}) {
  const {
    record,
    references,
    shares,
    detailQ,
    referencesQ,
    sharesQ,
    patchMetadata,
    reprocess,
    release,
    download,
    createShare,
    revokeShare,
    revokeShareById,
    confirmDelete,
  } = useAdminMediaDetail(mediaId, open);

  const [replaceOpen, setReplaceOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    filename: '',
    originalFilename: '',
    description: '',
    visibility: 'PRIVATE',
  });

  useEffect(() => {
    if (!record) return;
    setEditForm({
      filename: record.filename,
      originalFilename: record.originalFilename ?? record.filename,
      description:
        typeof record.metadata?.description === 'string' ? record.metadata.description : '',
      visibility: record.visibility ?? 'PRIVATE',
    });
  }, [record]);

  const handleDelete = async () => {
    const ok = await confirmDelete({
      quarantined: variant === 'quarantine',
      referenceCount: references.referenceCount,
    });
    if (ok) {
      onOpenChange(false);
      onDeleted?.();
    }
  };

  const handleSaveMetadata = () => {
    if (!mediaId) return;
    patchMetadata.mutate(
      {
        filename: editForm.filename.trim() || undefined,
        originalFilename: editForm.originalFilename.trim() || undefined,
        description: editForm.description.trim() || undefined,
        visibility: editForm.visibility as 'PRIVATE' | 'PUBLIC',
      },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleCreateShare = async (options: {
    purpose: string;
    expiresInSeconds: number;
    password?: string;
  }) => {
    const result = await createShare.mutateAsync(options);
    const shareUrl =
      result &&
      typeof result === 'object' &&
      typeof (result as { shareUrl?: string }).shareUrl === 'string'
        ? (result as { shareUrl: string }).shareUrl
        : undefined;
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied');
      } catch {
        // dialog shows copy UI
      }
    }
    return shareUrl ? { shareUrl } : undefined;
  };

  const formatShareExpiry = (expiresAt?: string | null) => {
    if (!expiresAt) return 'No expiry';
    const date = new Date(expiresAt);
    const ms = date.getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const days = Math.ceil(ms / (86400 * 1000));
    return `Expires ${date.toLocaleString()} (${days}d left)`;
  };

  const previewUrl = safeNavigationUrl(
    record?.previewUrl ?? record?.thumbnailUrl ?? record?.urls?.original
  );
  const mime = (record?.mimeType ?? '').toLowerCase();
  const isImage = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  const isPdf =
    mime === 'application/pdf' || (record?.filename ?? '').toLowerCase().endsWith('.pdf');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(92vh,920px)] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
            <DialogTitle className="truncate pr-4 text-lg">
              {record?.filename ?? 'Media detail'}
            </DialogTitle>
            <DialogClose
              aria-label="Close"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            >
              Close
            </DialogClose>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AdminQueryState isLoading={detailQ.isPending} error={detailQ.error}>
              {record ? (
                <div className="space-y-6 px-6 py-5">
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                    {previewUrl && isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={record.filename}
                        className="mx-auto max-h-[min(50vh,420px)] w-full object-contain"
                      />
                    ) : previewUrl && isVideo ? (
                      <video
                        src={previewUrl}
                        controls
                        className="mx-auto max-h-[min(50vh,420px)] w-full bg-black"
                      />
                    ) : previewUrl && isPdf ? (
                      <iframe
                        title={record.filename}
                        src={previewUrl}
                        referrerPolicy="no-referrer"
                        className="h-[min(50vh,420px)] w-full border-0 bg-white"
                      />
                    ) : (
                      <div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
                        <p>No preview available</p>
                        {previewUrl ? (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Open file
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge variant={resolveMediaStatusVariant(record.status)} dot>
                      {record.status.replace(/_/g, ' ')}
                    </StatusBadge>
                    {record.visibility ? (
                      <StatusBadge variant="neutral">{record.visibility}</StatusBadge>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {formatMediaBytes(record.size)}
                    </span>
                  </div>

                  {variant === 'quarantine' && (record.virusInfo || record.quarantineReason) ? (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                      <p className="font-medium text-destructive">Quarantine details</p>
                      {record.quarantineReason ? (
                        <p className="mt-1">Reason: {record.quarantineReason}</p>
                      ) : null}
                      {record.virusInfo ? <p className="mt-1">Scan: {record.virusInfo}</p> : null}
                    </div>
                  ) : null}

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">Metadata</h3>
                      <Button size="sm" variant="outline" onClick={() => setEditOpen((v) => !v)}>
                        {editOpen ? 'Cancel edit' : 'Edit metadata'}
                      </Button>
                    </div>
                    {editOpen ? (
                      <div className="space-y-3 rounded-lg border border-border p-4">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Filename
                          <Input
                            className="mt-1"
                            value={editForm.filename}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, filename: e.target.value }))
                            }
                            placeholder="invoice-april.pdf"
                          />
                        </label>
                        <label className="block text-xs font-medium text-muted-foreground">
                          Display name
                          <Input
                            className="mt-1"
                            value={editForm.originalFilename}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, originalFilename: e.target.value }))
                            }
                            placeholder="April invoice (client copy)"
                          />
                        </label>
                        <label className="block text-xs font-medium text-muted-foreground">
                          Description
                          <Input
                            className="mt-1"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, description: e.target.value }))
                            }
                            placeholder="Receipt for milestone 2"
                          />
                        </label>
                        <label className="block text-xs font-medium text-muted-foreground">
                          Visibility
                          <select
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editForm.visibility}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, visibility: e.target.value }))
                            }
                          >
                            <option value="PRIVATE">PRIVATE</option>
                            <option value="PUBLIC">PUBLIC</option>
                          </select>
                        </label>
                        <Button
                          size="sm"
                          disabled={patchMetadata.isPending}
                          onClick={handleSaveMetadata}
                        >
                          Save metadata
                        </Button>
                      </div>
                    ) : (
                      <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">MIME type</dt>
                          <dd>{record.mimeType}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Uploader</dt>
                          <dd>
                            {record.uploader?.email ?? record.uploaderId ?? '—'}
                            {record.uploaderId ? (
                              <>
                                {' '}
                                <Link
                                  href={`/users/${record.uploaderId}`}
                                  className="text-primary hover:underline"
                                >
                                  View user
                                </Link>
                              </>
                            ) : null}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Context</dt>
                          <dd>
                            {record.contextType
                              ? `${record.contextType}${record.contextId ? `: ${record.contextId}` : ''}`
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Uploaded</dt>
                          <dd>
                            {record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-muted-foreground">Media ID</dt>
                          <dd className="break-all font-mono text-xs">{record.id}</dd>
                        </div>
                      </dl>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold">References</h3>
                    <AdminQueryState isLoading={referencesQ.isPending} error={referencesQ.error}>
                      <AdminMediaReferencesList
                        references={references.references}
                        referenceCount={references.referenceCount}
                        compact
                      />
                    </AdminQueryState>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">Share links</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={createShare.isPending || record.status !== 'READY'}
                          onClick={() => setShareOpen(true)}
                        >
                          Create link
                        </Button>
                        {shares.length > 1 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={revokeShare.isPending}
                            onClick={() => revokeShare.mutate()}
                          >
                            Revoke all
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <AdminQueryState isLoading={sharesQ.isPending} error={sharesQ.error}>
                      {shares.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active share links.</p>
                      ) : (
                        <ul className="space-y-2">
                          {shares.map((share) => (
                            <li
                              key={share.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{share.purpose || 'Untitled share'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatShareExpiry(share.expiresAt)}
                                  {share.passwordProtected ? ' · Password protected' : ''}
                                </p>
                                {share.createdAt ? (
                                  <p className="text-xs text-muted-foreground">
                                    Created {new Date(share.createdAt).toLocaleString()}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 gap-2">
                                {share.shareUrl ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(share.shareUrl!);
                                        toast.success('Link copied');
                                      } catch {
                                        toast.error('Could not copy link');
                                      }
                                    }}
                                  >
                                    Copy
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={revokeShareById.isPending}
                                  onClick={() => revokeShareById.mutate(share.id)}
                                >
                                  Revoke
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </AdminQueryState>
                  </section>

                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={download.isPending || record.status !== 'READY'}
                      onClick={() => download.mutate()}
                    >
                      Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReplaceOpen(true)}>
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reprocess.isPending}
                      onClick={() => reprocess.mutate()}
                    >
                      Reprocess
                    </Button>
                    {variant === 'quarantine' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={release.isPending}
                        onClick={() => release.mutate()}
                      >
                        Release
                      </Button>
                    ) : null}
                    <Button size="sm" variant="destructive" onClick={() => void handleDelete()}>
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="px-6 py-8 text-sm text-muted-foreground">Media not found.</p>
              )}
            </AdminQueryState>
          </div>
        </DialogContent>
      </Dialog>

      <AdminMediaReplaceDialog
        mediaId={mediaId}
        filename={record?.filename ?? 'File'}
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
      />

      <AdminMediaCreateShareDialog
        filename={record?.filename ?? 'File'}
        open={shareOpen}
        isSubmitting={createShare.isPending}
        onOpenChange={setShareOpen}
        onSubmit={handleCreateShare}
      />
    </>
  );
}
