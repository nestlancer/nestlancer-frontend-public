'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, StatusBadge } from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { AdminDataShell } from '@/components/admin/AdminPageChrome';
import { resolveMediaStatusVariant } from '@/lib/admin-status';
import { pickAdminPagination } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { AdminMediaDetailDrawer } from './AdminMediaDetailDrawer';
import { formatMediaBytes, parseAdminMediaRows, type AdminMediaRecord } from './types';

export function AdminMediaQuarantineClient() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [page, setPage] = useState(1);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ['admin', 'media', 'quarantine', page],
    queryFn: () => apiServices.mediaAdmin.listQuarantined({ page, limit: 20, includeUrls: false }),
  });

  const releaseM = useMutation({
    mutationFn: (id: string) => apiServices.mediaAdmin.releaseQuarantined(id),
    onSuccess: () => {
      toast.success('Released from quarantine');
      void qc.invalidateQueries({ queryKey: ['admin', 'media', 'quarantine'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Release failed')),
  });

  const reprocessM = useMutation({
    mutationFn: (id: string) => apiServices.mediaAdmin.reprocess(id),
    onSuccess: () => {
      toast.success('Reprocess queued');
      void qc.invalidateQueries({ queryKey: ['admin', 'media', 'quarantine'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Reprocess failed')),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiServices.mediaAdmin.deleteQuarantined(id),
    onSuccess: () => {
      toast.success('Quarantined file deleted');
      void qc.invalidateQueries({ queryKey: ['admin', 'media', 'quarantine'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  });

  const rows = parseAdminMediaRows(listQ.data);
  const pagination = pickAdminPagination(listQ.data);
  const totalPages = pagination?.totalPages ?? 1;

  const openDrawer = (id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminQueryState isLoading={listQ.isPending} error={listQ.error}>
        <AdminDataShell
          footer={
            totalPages > 1 ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
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
          {rows.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-sm font-medium">No quarantined media</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Files flagged by security scanning will appear here for release, reprocess, or
                delete.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <QuarantineRow
                  key={row.id}
                  row={row}
                  onOpen={() => openDrawer(row.id)}
                  onRelease={() => releaseM.mutate(row.id)}
                  onReprocess={() => reprocessM.mutate(row.id)}
                  onDelete={async () => {
                    const { confirmed } = await confirm({
                      title: 'Delete quarantined file',
                      description:
                        'Permanently delete this quarantined file? This cannot be undone.',
                      destructive: true,
                      confirmLabel: 'Delete',
                    });
                    if (!confirmed) return;
                    deleteM.mutate(row.id);
                  }}
                  releasePending={releaseM.isPending}
                  reprocessPending={reprocessM.isPending}
                  deletePending={deleteM.isPending}
                />
              ))}
            </ul>
          )}
        </AdminDataShell>
      </AdminQueryState>

      <AdminMediaDetailDrawer
        mediaId={drawerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        variant="quarantine"
        onDeleted={() => {
          setDrawerOpen(false);
          setDrawerId(null);
        }}
      />
    </div>
  );
}

function QuarantineRow({
  row,
  onOpen,
  onRelease,
  onReprocess,
  onDelete,
  releasePending,
  reprocessPending,
  deletePending,
}: {
  row: AdminMediaRecord;
  onOpen: () => void;
  onRelease: () => void;
  onReprocess: () => void;
  onDelete: () => void;
  releasePending: boolean;
  reprocessPending: boolean;
  deletePending: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
        <p className="font-medium hover:underline">{row.filename}</p>
        <p className="text-xs text-muted-foreground">
          {row.mimeType} · {formatMediaBytes(row.size)}
          {row.uploaderId ? ` · uploader ${row.uploaderId.slice(0, 8)}…` : ''}
        </p>
        {row.quarantineReason || row.virusInfo ? (
          <div className="mt-2 space-y-1">
            {row.quarantineReason ? (
              <p className="text-xs text-destructive">Reason: {row.quarantineReason}</p>
            ) : null}
            {row.virusInfo ? (
              <p className="text-xs text-destructive">Scan: {row.virusInfo}</p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-2">
          <StatusBadge variant={resolveMediaStatusVariant(row.status)} dot>
            {row.status.replace(/_/g, ' ')}
          </StatusBadge>
        </div>
      </button>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onOpen}>
          Details
        </Button>
        <Button size="sm" variant="outline" disabled={releasePending} onClick={onRelease}>
          Release
        </Button>
        <Button size="sm" variant="outline" disabled={reprocessPending} onClick={onReprocess}>
          Reprocess
        </Button>
        <Button size="sm" variant="destructive" disabled={deletePending} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}
