'use client';

import { useQueries } from '@tanstack/react-query';
import { cn } from '@nestlancer/ui';
import { safeHttpUrl } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';
import { asRecord } from '@/lib/client-api-view';

export function ProgressAttachmentLinks({
  attachmentIds,
  className,
}: {
  attachmentIds: string[];
  className?: string;
}) {
  const queries = useQueries({
    queries: attachmentIds.map((mediaId) => ({
      queryKey: ['media', 'attachment-link', mediaId] as const,
      queryFn: async () => {
        const [url, metaRaw] = await Promise.all([
          apiServices.media.downloadUrl(mediaId),
          apiServices.media.getById(mediaId).catch(() => null),
        ]);
        const meta = asRecord(metaRaw);
        const inner = meta?.data && typeof meta.data === 'object' ? asRecord(meta.data) : meta;
        const filename = String(
          inner?.originalFilename ?? inner?.filename ?? inner?.name ?? ''
        ).trim();
        return { mediaId, url, filename };
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  if (attachmentIds.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {attachmentIds.map((mediaId, i) => {
        const q = queries[i];
        const url = safeHttpUrl(q?.data?.url);
        const filename = q?.data?.filename;
        const label = filename || `Attachment ${i + 1}`;
        if (url) {
          return (
            <li key={mediaId}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline"
              >
                {label}
              </a>
            </li>
          );
        }
        return (
          <li key={mediaId} className="text-xs text-muted-foreground">
            {q?.isPending ? 'Loading attachment…' : label}
          </li>
        );
      })}
    </ul>
  );
}
