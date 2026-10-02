'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileArchive, FileText, Image as ImageIcon } from '@nestlancer/ui/icons';
import { cn } from '@nestlancer/ui';
import { safeNavigationUrl } from '@nestlancer/utils';
import { apiServices } from '@/lib/axios';
import { parseAdminMediaRecord } from './types';

/**
 * Loads a presigned thumbnail only when the element is visible (one S3 URL per file max).
 */
export function LazyMediaThumbnail({
  mediaId,
  mimeType,
  className,
  alt = '',
}: {
  mediaId: string;
  mimeType: string;
  className?: string;
  alt?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const detailQ = useQuery({
    queryKey: ['admin', 'media', 'thumb', mediaId],
    queryFn: () => apiServices.mediaAdmin.getById(mediaId),
    enabled: visible && mimeType.startsWith('image/'),
    staleTime: 5 * 60 * 1000,
  });

  const record = parseAdminMediaRecord(detailQ.data);
  const thumb = safeNavigationUrl(record?.thumbnailUrl ?? record?.previewUrl);

  return (
    <div ref={ref} className={cn('relative h-full w-full', className)}>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
      ) : (
        <MimeIcon mimeType={mimeType} />
      )}
    </div>
  );
}

export function MimeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const kind = mimeType.split('/')[0] ?? 'file';
  const isArchive =
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('compressed') ||
    mimeType.includes('archive');

  let Icon = FileText;
  let label = 'DOC';
  let tone = 'text-muted-foreground bg-muted/40';

  if (kind === 'image') {
    Icon = ImageIcon;
    label = 'IMG';
    tone = 'text-sky-600 bg-sky-500/10';
  } else if (kind === 'video') {
    label = 'VID';
    tone = 'text-violet-600 bg-violet-500/10';
  } else if (kind === 'audio') {
    label = 'AUD';
    tone = 'text-rose-600 bg-rose-500/10';
  } else if (isArchive) {
    Icon = FileArchive;
    label = 'ZIP';
    tone = 'text-amber-700 bg-amber-500/10';
  } else if (kind === 'text') {
    label = 'TXT';
  }

  return (
    <span
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-1.5',
        tone,
        className
      )}
    >
      {kind === 'video' ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-6 w-6"
          aria-hidden
        >
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
        </svg>
      ) : (
        <Icon className="h-6 w-6" aria-hidden />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</span>
    </span>
  );
}
