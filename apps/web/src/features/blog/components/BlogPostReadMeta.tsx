'use client';

import { useEffect, useRef, useState } from 'react';

import { apiServices } from '@/lib/axios';
import { formatViewCount, readingTimeLabel } from '@/features/blog/blog-utils';
import { blogDebug, blogDebugError } from '@/features/blog/blog-debug';

export function BlogPostReadMeta({
  slug,
  initialViewCount = 0,
  readingTime,
}: {
  slug: string;
  initialViewCount?: number;
  readingTime?: number | null;
}) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    blogDebug('view record start', { slug, initialViewCount });
    void apiServices.blog
      .recordView(slug)
      .then((result) => {
        blogDebug('view record success', { slug, result, previousCount: initialViewCount });
        if (typeof result?.viewCount === 'number') {
          setViewCount(result.viewCount);
        } else if (result?.recorded && typeof initialViewCount === 'number') {
          setViewCount((c) => c + 1);
        }
      })
      .catch((error) => {
        blogDebugError('view record failed', error, { slug, initialViewCount });
      });
  }, [slug, initialViewCount]);

  const parts = [
    readingTime ? readingTimeLabel(readingTime) : null,
    formatViewCount(viewCount) || (viewCount > 0 ? `${viewCount.toLocaleString()} views` : null),
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <span className="font-mono text-xs text-[hsl(var(--article-meta))]">{parts.join(' · ')}</span>
  );
}
