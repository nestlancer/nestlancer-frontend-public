import { resolvePublicApiUrl } from '@nestlancer/config';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const apiBase = resolvePublicApiUrl();

export const metadata: Metadata = {
  alternates: {
    types: {
      'application/rss+xml': `${apiBase}/api/v1/blog/feed/rss`,
      'application/atom+xml': `${apiBase}/api/v1/blog/feed/atom`,
    },
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
