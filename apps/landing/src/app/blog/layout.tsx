import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog',
  description:
    'Product updates and studio insights from Nestlancer — practical writing for teams who ship.',
  path: '/blog',
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
