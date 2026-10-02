'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, PctProgressFill } from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState, AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { AdminMetricStrip } from '@/components/admin/AdminPageChrome';
import { apiServices } from '@/lib/axios';

import { formatMediaBytes } from './types';

type AnalyticsData = {
  totalFiles?: number;
  totalSize?: number;
  quarantineCount?: number;
  processingCount?: number;
  byMimeType?: Array<{ mimeType: string; count: number; size: number }>;
  uploadsByDay?: Array<{ date: string; count: number }>;
  byStatus?: Array<{ status: string; count: number }>;
};

function asAnalytics(data: unknown): AnalyticsData {
  const d = data as Record<string, unknown> | undefined | null;
  const target = (d && 'data' in d ? d.data : d) as Record<string, unknown> | undefined | null;

  const byStatus = Array.isArray(target?.byStatus)
    ? (target.byStatus as Array<{ status?: string; count?: number }>).map((row) => ({
        status: String(row.status ?? ''),
        count: Number(row.count ?? 0),
      }))
    : [];

  const quarantineFromStatus = byStatus.find((row) =>
    row.status.toLowerCase().includes('quarantine')
  )?.count;

  const processingFromStatus = byStatus
    .filter((row) => {
      const s = row.status.toLowerCase();
      return s.includes('process') || s.includes('upload') || s.includes('pending');
    })
    .reduce((sum, row) => sum + row.count, 0);

  return {
    totalFiles: Number(target?.totalFiles ?? target?.totalCount ?? target?.total ?? 0),
    totalSize: Number(target?.totalSize ?? target?.storageUsed ?? target?.totalBytes ?? 0),
    quarantineCount: Number(
      target?.quarantineCount ?? target?.quarantined ?? quarantineFromStatus ?? 0
    ),
    processingCount: Number(
      target?.processingCount ?? target?.processing ?? processingFromStatus ?? 0
    ),
    byMimeType: Array.isArray(target?.byMimeType)
      ? (target.byMimeType as Array<{ mimeType: string; count: number; size?: number }>).map(
          (row) => ({
            mimeType: String(row.mimeType ?? 'unknown'),
            count: Number(row.count ?? 0),
            size: Number(row.size ?? 0),
          })
        )
      : [],
    uploadsByDay: Array.isArray(target?.uploadsByDay)
      ? (target.uploadsByDay as Array<{ date: string; count: number }>).map((row) => ({
          date: String(row.date),
          count: Number(row.count ?? 0),
        }))
      : [],
    byStatus,
  };
}

type CleanupResult = {
  cleaned?: number;
  bytesFreed?: number;
  dryRun?: boolean;
  orphans?: Array<{ id: string; filename?: string; size?: number }>;
};

function asCleanupResult(data: unknown): CleanupResult {
  const record =
    data && typeof data === 'object' ? ((data as Record<string, unknown>).data ?? data) : null;
  if (!record || typeof record !== 'object') return {};
  const o = record as Record<string, unknown>;
  const cleaned =
    typeof o.cleaned === 'number'
      ? o.cleaned
      : typeof o.wouldDelete === 'number'
        ? o.wouldDelete
        : undefined;
  const orphansFromPayload = Array.isArray(o.orphans)
    ? (o.orphans as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id ?? ''),
        filename: row.filename != null ? String(row.filename) : undefined,
        size: typeof row.size === 'number' ? row.size : undefined,
      }))
    : undefined;
  const orphansFromIds =
    !orphansFromPayload && Array.isArray(o.ids)
      ? (o.ids as unknown[]).map((id) => ({ id: String(id) }))
      : undefined;
  return {
    cleaned,
    bytesFreed: typeof o.bytesFreed === 'number' ? o.bytesFreed : undefined,
    dryRun: typeof o.dryRun === 'boolean' ? o.dryRun : undefined,
    orphans: orphansFromPayload ?? orphansFromIds,
  };
}

export function AdminMediaAnalyticsClient() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [cleanupPreview, setCleanupPreview] = useState<CleanupResult | null>(null);

  const analyticsQ = useQuery({
    queryKey: ['admin', 'media', 'analytics'],
    queryFn: () => apiServices.mediaAdmin.getAnalytics(),
  });

  const cleanupPreviewM = useMutation({
    mutationFn: () => apiServices.mediaAdmin.cleanup(true),
    onSuccess: (data) => {
      setCleanupPreview(asCleanupResult(data));
      toast.success('Cleanup preview ready');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Preview failed')),
  });

  const cleanupRunM = useMutation({
    mutationFn: () => apiServices.mediaAdmin.cleanup(false),
    onSuccess: (data) => {
      const result = asCleanupResult(data);
      toast.success(
        `Cleanup complete — removed ${result.cleaned ?? 0} file(s), freed ${formatMediaBytes(result.bytesFreed ?? 0)}`
      );
      setCleanupPreview(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'media', 'analytics'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'media', 'all'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cleanup failed')),
  });

  const stats = asAnalytics(analyticsQ.data);

  const byMimeTypeSection: React.ReactNode =
    stats.byMimeType && stats.byMimeType.length > 0 ? (
      <div className="ge-card p-5">
        <h3 className="mb-4 font-semibold">Files by type</h3>
        <div className="space-y-3">
          {stats.byMimeType.slice(0, 10).map((item) => {
            const maxCount = Math.max(...(stats.byMimeType?.map((i) => i.count) ?? [1]), 1);
            const pct = Math.round((item.count / maxCount) * 100);
            return (
              <div key={item.mimeType} className="flex items-center gap-3">
                <span className="w-40 truncate text-xs text-muted-foreground">{item.mimeType}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <PctProgressFill pct={pct} fillClassName="fill-primary" className="h-full" />
                </div>
                <span className="w-16 text-right text-xs">
                  {item.count} ({formatMediaBytes(item.size)})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  const uploadsByDaySection: React.ReactNode =
    stats.uploadsByDay && stats.uploadsByDay.length > 0 ? (
      <div className="ge-card p-5">
        <h3 className="mb-4 font-semibold">Uploads (last 30 days)</h3>
        <svg
          viewBox="0 0 30 96"
          className="flex h-24 w-full items-end gap-px"
          preserveAspectRatio="none"
          role="img"
          aria-label="Uploads per day"
        >
          {stats.uploadsByDay.slice(-30).map((day, index) => {
            const max = Math.max(...(stats.uploadsByDay?.map((d) => d.count) ?? [1]), 1);
            const h = Math.max(4, Math.round((day.count / max) * 96));
            return (
              <rect
                key={day.date}
                x={index}
                y={96 - h}
                width={0.85}
                height={h}
                className="fill-primary/70"
              >
                <title>{`${day.date}: ${day.count} uploads`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
    ) : null;

  return (
    <AdminQueryState isLoading={analyticsQ.isPending} error={analyticsQ.error as Error | null}>
      <div className="space-y-6">
        <AdminMetricStrip
          items={[
            { label: 'Total files', value: stats.totalFiles?.toLocaleString() ?? '—' },
            { label: 'Storage used', value: formatMediaBytes(stats.totalSize ?? 0) },
            { label: 'Quarantined', value: stats.quarantineCount?.toLocaleString() ?? '0' },
            { label: 'Processing', value: stats.processingCount?.toLocaleString() ?? '0' },
          ]}
          max={4}
        />

        {byMimeTypeSection}
        {uploadsByDaySection}

        <AdminSection title="Storage maintenance">
          <p className="mb-4 text-sm text-muted-foreground">
            Preview unattached private media (no context, excluding published site assets) before
            cleanup. Dry run does not delete anything.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={cleanupPreviewM.isPending}
              onClick={() => cleanupPreviewM.mutate()}
            >
              {cleanupPreviewM.isPending ? 'Previewing…' : 'Preview cleanup'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={cleanupRunM.isPending}
              onClick={async () => {
                const count = cleanupPreview?.cleaned ?? cleanupPreview?.orphans?.length;
                const { confirmed } = await confirm({
                  title: 'Run storage cleanup',
                  description: count
                    ? `Delete approximately ${count} orphaned file(s)? This cannot be undone.`
                    : 'Delete orphaned media files with no context? Run preview first to see impact.',
                  destructive: true,
                  confirmLabel: 'Run cleanup',
                });
                if (!confirmed) return;
                cleanupRunM.mutate();
              }}
            >
              {cleanupRunM.isPending ? 'Cleaning…' : 'Run cleanup'}
            </Button>
          </div>

          {cleanupPreview ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
              <p>
                Preview: {cleanupPreview.cleaned ?? cleanupPreview.orphans?.length ?? 0} orphaned
                file(s), {formatMediaBytes(cleanupPreview.bytesFreed ?? 0)} reclaimable.
              </p>
              {cleanupPreview.orphans && cleanupPreview.orphans.length > 0 ? (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {cleanupPreview.orphans.slice(0, 20).map((row) => (
                    <li key={row.id}>
                      {row.filename ?? row.id}
                      {row.size != null ? ` · ${formatMediaBytes(row.size)}` : ''}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </AdminSection>

        {analyticsQ.data && !stats.totalFiles && stats.byMimeType?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No analytics data available yet.</p>
        ) : null}
      </div>
    </AdminQueryState>
  );
}
