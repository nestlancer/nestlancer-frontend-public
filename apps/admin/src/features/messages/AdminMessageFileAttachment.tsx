'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, parseFileMessageContent } from '@nestlancer/api-client';
import { cn } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

export function AdminFileMessageBubble({
  content,
  mine = false,
}: {
  content: string;
  mine?: boolean;
}) {
  const downloadM = useMutation({
    mutationFn: async (mediaId: string) => {
      const url = await apiServices.media.downloadUrl(mediaId);
      if (!url) throw new Error('Download URL unavailable');
      openSafeHttpUrl(url);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Download failed')),
  });

  const payload = parseFileMessageContent(content);
  if (!payload?.mediaId) {
    return <span className="block whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        className={cn(
          'text-left text-sm transition-colors',
          mine ? 'file-card-sent' : 'file-card-received'
        )}
        disabled={downloadM.isPending}
        onClick={() => downloadM.mutate(payload.mediaId)}
      >
        <span className="font-medium">{payload.filename ?? 'Attachment'}</span>
        {payload.mimeType ? (
          <span
            className={cn('text-xs', mine ? 'text-primary-foreground/75' : 'text-muted-foreground')}
          >
            {payload.mimeType}
          </span>
        ) : null}
        <span
          className={cn(
            'text-xs font-medium',
            mine ? 'text-primary-foreground/90' : 'text-primary'
          )}
        >
          {downloadM.isPending ? 'Preparing…' : 'Download'}
        </span>
      </button>
      {payload.caption ? (
        <p
          className={cn(
            'file-card-caption',
            mine ? 'text-primary-foreground/95' : 'text-foreground'
          )}
        >
          {payload.caption}
        </p>
      ) : null}
    </div>
  );
}
