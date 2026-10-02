'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, Dialog, DialogClose, DialogContent, DialogTitle } from '@nestlancer/ui';
import { safeHttpUrl } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';

export type FilePreviewTarget = {
  label: string;
  url?: string;
  mediaId?: string;
  mimeType?: string;
};

function inferMime(label: string, mimeType?: string): string {
  if (mimeType) return mimeType.toLowerCase();
  const lower = label.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.match(/\.(png|jpe?g|gif|webp|svg)$/)) return `image/${lower.split('.').pop()}`;
  if (lower.match(/\.(mp4|webm|mov)$/)) return 'video/mp4';
  return '';
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
  onPreviewed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FilePreviewTarget | null;
  onPreviewed?: () => void;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const resolveM = useMutation({
    mutationFn: async (mediaId: string) => {
      const url = await apiServices.media.downloadUrl(mediaId);
      if (!url) throw new Error('Preview URL unavailable');
      return url;
    },
    onSuccess: (url) => {
      setResolvedUrl(url);
      setResolveError(null);
      onPreviewed?.();
    },
    onError: (e) => {
      setResolveError(getApiErrorMessage(e, 'Could not load preview'));
      toast.error(getApiErrorMessage(e, 'Could not load preview'));
    },
  });

  useEffect(() => {
    if (!open || !file) {
      setResolvedUrl(null);
      setResolveError(null);
      return;
    }
    if (file.url) {
      setResolvedUrl(file.url);
      setResolveError(null);
      onPreviewed?.();
      return;
    }
    if (file.mediaId) {
      setResolvedUrl(null);
      setResolveError(null);
      resolveM.mutate(file.mediaId);
      return;
    }
    setResolvedUrl(null);
    setResolveError('No preview source available');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-resolve when dialog opens or target changes
  }, [open, file?.url, file?.mediaId, file?.label]);

  const mime = inferMime(file?.label ?? '', file?.mimeType);
  const isImage = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  const isPdf = mime === 'application/pdf' || (file?.label ?? '').toLowerCase().endsWith('.pdf');
  const safeUrl = safeHttpUrl(resolvedUrl);
  const canEmbed = Boolean(safeUrl) && (isImage || isVideo || isPdf);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
          <DialogTitle className="truncate pr-2 text-base">
            {file?.label ?? 'File preview'}
          </DialogTitle>
          <div className="flex shrink-0 items-center gap-2">
            {safeUrl ? (
              <Button size="sm" variant="outline" asChild>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </Button>
            ) : null}
            <DialogClose
              aria-label="Close preview"
              className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Close
            </DialogClose>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/20">
          {resolveM.isPending ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Preparing preview…
            </div>
          ) : resolveError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
              <p>{resolveError}</p>
            </div>
          ) : canEmbed && safeUrl && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeUrl}
              alt={file?.label ?? 'Preview'}
              className="mx-auto max-h-[min(70vh,720px)] w-full object-contain"
            />
          ) : canEmbed && safeUrl && isVideo ? (
            <video
              src={safeUrl}
              controls
              className="mx-auto max-h-[min(70vh,720px)] w-full bg-black"
            />
          ) : canEmbed && safeUrl && isPdf ? (
            <iframe
              title={file?.label ?? 'PDF preview'}
              src={safeUrl}
              referrerPolicy="no-referrer"
              className="h-[min(70vh,720px)] w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
              <p>No in-app preview for this file type.</p>
              {safeUrl ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                    Open in new tab
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
