'use client';

import { useEffect, useRef, useState } from 'react';

import { apiServices } from '@/lib/axios';

export function PortfolioViewMeta({
  idOrSlug,
  initialViewCount = 0,
}: {
  idOrSlug: string;
  initialViewCount?: number;
}) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void apiServices.portfolio
      .recordView(idOrSlug)
      .then((result) => {
        if (typeof result?.viewCount === 'number') {
          setViewCount(result.viewCount);
        } else if (result?.recorded) {
          setViewCount((c) => c + 1);
        }
      })
      .catch(() => {
        // Keep SSR count on failure
      });
  }, [idOrSlug, initialViewCount]);

  return (
    <span className="rounded-md border border-border px-3 py-1.5">
      {viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}
    </span>
  );
}
