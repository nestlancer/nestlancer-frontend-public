'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, parseFileMessageContent } from '@nestlancer/api-client';
import { cn } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

type FileMessageBubbleProps = {
  content: string;
  mine?: boolean;
};

export function FileMessageBubble({ content, mine = false }: FileMessageBubbleProps) {
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
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  const label = payload.filename ?? 'Attachment';

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
        <span className="font-medium">{label}</span>
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
          {downloadM.isPending ? 'Preparing download…' : 'Download'}
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
