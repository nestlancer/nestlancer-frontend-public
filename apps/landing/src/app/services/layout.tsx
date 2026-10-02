import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Services',
  description:
    'Nestlancer studio packages and engagements — web MVP, custom product builds, and milestone-based delivery.',
  path: '/services',
  keywords: [
    'Nestlancer services',
    'web application MVP',
    'custom software development',
    'product studio packages',
  ],
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
