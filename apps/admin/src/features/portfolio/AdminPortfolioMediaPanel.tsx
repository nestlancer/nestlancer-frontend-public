'use client';

import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, peelSuccessEnvelope } from '@nestlancer/api-client';
import { safeHttpUrl } from '@nestlancer/utils';
import { Button } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

type PreviewMediaRow = {
  id: string;
  mediaId: string;
  kind: string;
  title?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  url?: string | null;
  isThumbnail?: boolean;
  isFeaturedVideo?: boolean;
};

function kindLabel(kind: string) {
  switch (kind.toUpperCase()) {
    case 'VIDEO':
      return 'Video';
    case 'DOCUMENT':
      return 'Document';
    default:
      return 'Image';
  }
}

export function AdminPortfolioMediaPanel({ itemId }: { itemId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const mediaQ = useQuery({
    queryKey: [...adminKeys.portfolioItem(itemId), 'media'],
    queryFn: () => apiServices.admin.listAdminPortfolioMedia(itemId),
  });

  const peeled = peelSuccessEnvelope(mediaQ.data);
  const mediaList: PreviewMediaRow[] = Array.isArray(peeled)
    ? (peeled as PreviewMediaRow[])
    : (pickAdminRows(peeled) as PreviewMediaRow[]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.portfolioItem(itemId) });
    void qc.invalidateQueries({ queryKey: [...adminKeys.portfolioItem(itemId), 'media'] });
  };

  const uploadM = useMutation({
    mutationFn: (file: File) => apiServices.admin.uploadAdminPortfolioMedia(itemId, file),
    onSuccess: () => {
      toast.success('Preview file uploaded');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Upload failed')),
  });

  const deleteM = useMutation({
    mutationFn: (mediaId: string) => apiServices.admin.deleteAdminPortfolioMedia(itemId, mediaId),
    onSuccess: () => {
      toast.success('File removed');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Remove failed')),
  });

  const thumbM = useMutation({
    mutationFn: (mediaId: string) => apiServices.admin.setAdminPortfolioThumbnail(itemId, mediaId),
    onSuccess: () => {
      toast.success('Thumbnail updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not set thumbnail')),
  });

  const videoM = useMutation({
    mutationFn: (mediaId: string) =>
      apiServices.admin.setAdminPortfolioFeaturedVideo(itemId, mediaId),
    onSuccess: () => {
      toast.success('Featured video updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not set video')),
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preview files
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload images, videos (MP4/WebM), and documents (PDF, etc.) shown on the public
            showcase.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*,video/mp4,video/webm,application/pdf,.pdf,.doc,.docx,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadM.mutate(file);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="rounded-lg"
            disabled={uploadM.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {uploadM.isPending ? 'Uploading…' : 'Upload file'}
          </Button>
        </div>
      </div>

      {mediaQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading preview files…</p>
      ) : mediaList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No preview files yet. Upload screenshots, a walkthrough video, or a PDF case study.
        </p>
      ) : (
        <ul className="space-y-3">
          {mediaList.map((row) => {
            const label = row.title || row.filename || row.mediaId;
            const isImage = row.kind?.toUpperCase() === 'IMAGE';
            const isVideo = row.kind?.toUpperCase() === 'VIDEO';
            return (
              <li
                key={row.id ?? row.mediaId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                {isImage && safeHttpUrl(row.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={safeHttpUrl(row.url) ?? undefined}
                    alt=""
                    className="h-14 w-20 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-20 items-center justify-center rounded-lg border bg-background text-xs text-muted-foreground">
                    {kindLabel(row.kind)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {kindLabel(row.kind)}
                    {row.mimeType ? ` · ${row.mimeType}` : ''}
                    {row.isThumbnail ? ' · Thumbnail' : ''}
                    {row.isFeaturedVideo ? ' · Featured video' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isImage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={thumbM.isPending || row.isThumbnail}
                      onClick={() => thumbM.mutate(row.mediaId)}
                    >
                      Use as thumbnail
                    </Button>
                  ) : null}
                  {isVideo ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={videoM.isPending || row.isFeaturedVideo}
                      onClick={() => videoM.mutate(row.mediaId)}
                    >
                      Use as featured video
                    </Button>
                  ) : null}
                  {safeHttpUrl(row.url) ? (
                    <a
                      href={safeHttpUrl(row.url) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center rounded-lg border px-3 text-xs hover:bg-background"
                    >
                      Preview
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-lg text-destructive"
                    disabled={deleteM.isPending}
                    onClick={() => deleteM.mutate(row.mediaId)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
