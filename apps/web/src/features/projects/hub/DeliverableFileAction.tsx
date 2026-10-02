'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { cn, toast } from '@nestlancer/ui';
import { openSafeHttpUrl, safeHttpUrl } from '@nestlancer/utils';

import {
  FilePreviewDialog,
  type FilePreviewTarget,
} from '@/features/media/components/FilePreviewDialog';
import { apiServices } from '@/lib/axios';

import type { DeliverableFileLink } from '@/features/projects/hub/deliverable-utils';

type DeliverableFileActionProps = {
  file: DeliverableFileLink;
  className?: string;
  children?: React.ReactNode;
  mode?: 'preview' | 'open';
  onPreviewed?: () => void;
};

export function DeliverableFileAction({
  file,
  className,
  children,
  mode = 'preview',
  onPreviewed,
}: DeliverableFileActionProps) {
  const [preview, setPreview] = useState<FilePreviewTarget | null>(null);

  const downloadM = useMutation({
    mutationFn: async () => {
      if (!file.mediaId) throw new Error('Download unavailable');
      const url = await apiServices.media.downloadUrl(file.mediaId);
      if (!url) throw new Error('Download URL unavailable');
      openSafeHttpUrl(url);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Download failed')),
  });

  const canPreview = Boolean(file.url || file.mediaId);

  if (mode === 'preview' && canPreview) {
    return (
      <>
        <button
          type="button"
          className={cn('text-left', className)}
          onClick={() =>
            setPreview({
              label: file.label,
              url: file.url || undefined,
              mediaId: file.mediaId,
            })
          }
        >
          {children ?? file.label}
        </button>
        <FilePreviewDialog
          open={preview != null}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
          file={preview}
          onPreviewed={onPreviewed}
        />
      </>
    );
  }

  if (file.url && safeHttpUrl(file.url)) {
    return (
      <a
        href={safeHttpUrl(file.url) ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children ?? file.label}
      </a>
    );
  }

  if (file.mediaId) {
    return (
      <button
        type="button"
        className={cn('text-left', className)}
        disabled={downloadM.isPending}
        onClick={() => downloadM.mutate()}
      >
        {children ?? (downloadM.isPending ? 'Preparing download…' : file.label)}
      </button>
    );
  }

  return <span className={className}>{children ?? file.label}</span>;
}
