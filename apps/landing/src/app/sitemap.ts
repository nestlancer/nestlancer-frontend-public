import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/services', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.85 },
  // Blog + portfolio live on app.nestlancer.com (landing paths 307 there) — omit redirect locs.
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}
