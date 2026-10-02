'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, FolderOpen } from '@nestlancer/ui/icons';
import { useState } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { EmptyState, ErrorState, IconContainer } from '@nestlancer/ui';
import { formatBytes } from '@nestlancer/utils';

import { TabPanelSkeleton } from '@/components/common/TabPanelSkeleton';
import { WebPanel } from '@/components/web/WebPanel';

import {
  FilePreviewDialog,
  type FilePreviewTarget,
} from '@/features/media/components/FilePreviewDialog';
import { extractDeliverables } from '@/features/projects/hub/deliverable-utils';
import { apiServices } from '@/lib/axios';
import { asRecord } from '@/lib/client-api-view';

type FileRow = {
  id: string;
  name: string;
  url?: string;
  mediaId?: string;
  mimeType?: string;
  sizeLabel?: string;
  source: string;
};

function pickMediaUrl(o: Record<string, unknown>): string {
  if (o.url != null && String(o.url)) return String(o.url);
  if (o.signedUrl != null && String(o.signedUrl)) return String(o.signedUrl);
  const urls = asRecord(o.urls);
  if (!urls) return '';
  for (const key of ['original', 'preview', 'thumbnail'] as const) {
    const value = urls[key];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

function extractMediaFiles(data: unknown, projectId: string): FileRow[] {
  const r = asRecord(data);
  if (!r) return [];
  const raw = Array.isArray(r.items)
    ? r.items
    : Array.isArray(r.data)
      ? r.data
      : Array.isArray(data)
        ? (data as unknown[])
        : [];
  const rows: FileRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const o = asRecord((raw as unknown[])[i]) ?? {};
    const contextId = o.contextId != null ? String(o.contextId) : '';
    if (contextId && contextId !== projectId) continue;
    const url = pickMediaUrl(o);
    const name = String(o.filename ?? o.name ?? o.title ?? `File ${i + 1}`);
    const size = typeof o.size === 'number' ? o.size : undefined;
    const id = o.id != null ? String(o.id) : `media-${i}`;
    rows.push({
      id,
      name,
      url: url || undefined,
      mediaId: o.id != null ? String(o.id) : undefined,
      mimeType: o.mimeType != null ? String(o.mimeType) : undefined,
      sizeLabel: typeof size === 'number' && size >= 0 ? formatBytes(size) : undefined,
      source: 'Media library',
    });
  }
  return rows;
}

export function ProjectHubFilesTab({ projectId }: { projectId: string }) {
  const [preview, setPreview] = useState<FilePreviewTarget | null>(null);
  const deliverables = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'deliverables'],
    queryFn: () => apiServices.projects.getDeliverables(projectId),
  });

  const media = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'media-files'],
    queryFn: () =>
      apiServices.media.list({
        contextType: 'project',
        contextId: projectId,
        limit: 50,
        includeUrls: true,
      }),
    retry: false,
  });

  const deliverableFiles: FileRow[] = extractDeliverables(deliverables.data).flatMap((d) =>
    d.files.map((f, idx) => ({
      id: `${d.id}-${idx}`,
      name: f.label,
      url: f.url || undefined,
      mediaId: f.mediaId,
      source: d.label,
      sizeLabel: typeof f.size === 'number' && f.size >= 0 ? formatBytes(f.size) : undefined,
    }))
  );

  const mediaFiles = media.data != null ? extractMediaFiles(media.data, projectId) : [];
  const files = [...deliverableFiles, ...mediaFiles];
  // NL-UI-012 / NL-DATA-002: collapse duplicates; keep size when either side has it.
  const byMediaId = new Map<string, FileRow>();
  const byName = new Map<string, FileRow>();
  const uniqueFiles: FileRow[] = [];

  const mergeSize = (a: FileRow, b: FileRow): FileRow =>
    !a.sizeLabel && b.sizeLabel
      ? { ...a, sizeLabel: b.sizeLabel, mimeType: a.mimeType ?? b.mimeType }
      : a;

  for (const f of files) {
    const nameKey = (f.name ?? '').trim().toLowerCase();
    if (f.mediaId && byMediaId.has(f.mediaId)) {
      const idx = uniqueFiles.indexOf(byMediaId.get(f.mediaId)!);
      if (idx >= 0) {
        uniqueFiles[idx] = mergeSize(uniqueFiles[idx]!, f);
        byMediaId.set(f.mediaId, uniqueFiles[idx]!);
        if (nameKey) byName.set(nameKey, uniqueFiles[idx]!);
      }
      continue;
    }
    if (nameKey && byName.has(nameKey)) {
      const idx = uniqueFiles.indexOf(byName.get(nameKey)!);
      if (idx >= 0) {
        uniqueFiles[idx] = mergeSize(uniqueFiles[idx]!, f);
        byName.set(nameKey, uniqueFiles[idx]!);
        if (f.mediaId) byMediaId.set(f.mediaId, uniqueFiles[idx]!);
      }
      continue;
    }
    uniqueFiles.push(f);
    if (f.mediaId) byMediaId.set(f.mediaId, f);
    if (nameKey) byName.set(nameKey, f);
  }

  // Deliverables are primary; do not block empty/list UI on optional media pending forever.
  const deliverablesSettled = !deliverables.isPending;
  const mediaSettled = !media.isPending;
  const showInitialSkeleton = !deliverablesSettled && !mediaSettled;

  if (showInitialSkeleton) {
    return <TabPanelSkeleton variant="list" />;
  }

  if (deliverables.isError && (media.isError || mediaSettled)) {
    if (uniqueFiles.length === 0) {
      return (
        <ErrorState
          title="Could not load files"
          message={getApiErrorMessage(deliverables.error ?? media.error, 'Could not load files')}
          onRetry={() => {
            void deliverables.refetch();
            void media.refetch();
          }}
        />
      );
    }
  }

  if (deliverablesSettled && uniqueFiles.length === 0 && (mediaSettled || media.isError)) {
    return (
      <EmptyState
        title="No files yet"
        description="Deliverable attachments and project media will show here when available."
        icon={<FolderOpen className="h-6 w-6" aria-hidden />}
      />
    );
  }

  if (deliverablesSettled && uniqueFiles.length === 0 && media.isPending) {
    return <TabPanelSkeleton variant="list" />;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {uniqueFiles.map((file) => (
          <WebPanel
            key={file.id}
            padding="md"
            className="transition-theme hover:border-ta-brand-500/35"
          >
            <div className="flex flex-col items-center text-center">
              <IconContainer variant="neutral" className="mb-4">
                <FileText className="h-5 w-5" aria-hidden />
              </IconContainer>
              <p className="text-sm font-medium break-all">{file.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{file.source}</p>
              {file.sizeLabel ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{file.sizeLabel}</p>
              ) : null}
              {file.url || file.mediaId ? (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  onClick={() =>
                    setPreview({
                      label: file.name,
                      url: file.url,
                      mediaId: file.mediaId,
                      mimeType: file.mimeType,
                    })
                  }
                >
                  Preview
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </button>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">Preview unavailable</p>
              )}
            </div>
          </WebPanel>
        ))}
      </div>

      <FilePreviewDialog
        open={preview != null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        file={preview}
      />
    </>
  );
}
