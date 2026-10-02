import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Portfolio',
  description:
    'Selected Nestlancer studio case studies — web, mobile, e-commerce, and UX work delivered for clients.',
  path: '/portfolio',
});

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
