import type { MetadataRoute } from 'next';

import { routes } from '@nestlancer/constants';

import { fetchGatewayJson } from '@/lib/gateway-fetch';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

type BlogListLite = {
  items?: Array<{ slug?: string; updatedAt?: string; publishedAt?: string }>;
};

type PortfolioListLite = {
  items?: Array<{ slug?: string; id?: string; updatedAt?: string; publishedAt?: string }>;
};

const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}[] = [
  // Marketing `/` and `/about` live on nestlancer.com (apex); do not list them on app.
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/portfolio', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.9 },
  // `/work` 307 → `/portfolio`; keep redirect for humans, omit from sitemap.
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  try {
    const blog = await fetchGatewayJson<BlogListLite>('/blog/posts?page=1&limit=100', {
      next: { revalidate: 3600 },
    });
    for (const post of blog.items ?? []) {
      if (!post.slug) continue;
      entries.push({
        url: absoluteUrl(routes.blogPost(post.slug)),
        lastModified:
          post.updatedAt || post.publishedAt ? new Date(post.updatedAt || post.publishedAt!) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // Sitemap still returns static routes if API is unavailable
  }

  try {
    const portfolio = await fetchGatewayJson<PortfolioListLite>('/portfolio?page=1&limit=100', {
      next: { revalidate: 3600 },
    });
    for (const item of portfolio.items ?? []) {
      const idOrSlug = item.slug || item.id;
      if (!idOrSlug) continue;
      entries.push({
        url: absoluteUrl(routes.portfolioItem(idOrSlug)),
        lastModified:
          item.updatedAt || item.publishedAt ? new Date(item.updatedAt || item.publishedAt!) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  } catch {
    // ignore
  }

  return entries;
}
