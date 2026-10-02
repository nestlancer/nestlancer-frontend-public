import type {
  BlogListResult,
  PortfolioCategorySummary,
  PortfolioListResult,
  PublicBlogPost,
  PublicPortfolioItem,
} from '@nestlancer/types';
import { listBlogPosts } from '@nestlancer/api-client';

import { fetchGatewayJson } from '@/lib/gateway-fetch';

function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const o = raw as { data?: unknown; items?: unknown };
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.items)) return o.items as T[];
  }
  return [];
}

function parsePortfolioCategories(raw: unknown): PortfolioCategorySummary[] {
  const rows = unwrapList<Record<string, unknown>>(raw);
  const out: PortfolioCategorySummary[] = [];
  for (const row of rows) {
    const id = String(row.id ?? row.slug ?? '');
    const name = String(row.name ?? '');
    if (!id || !name) continue;
    const slug = row.slug ? String(row.slug) : undefined;
    out.push(slug ? { id, name, slug } : { id, name });
  }
  return out;
}

function parsePortfolioItems(raw: unknown): PublicPortfolioItem[] {
  if (Array.isArray(raw)) return raw as PublicPortfolioItem[];
  if (raw && typeof raw === 'object') {
    const o = raw as { data?: unknown; items?: unknown };
    if (Array.isArray(o.data)) return o.data as PublicPortfolioItem[];
    if (Array.isArray(o.items)) return o.items as PublicPortfolioItem[];
    if (o.data && typeof o.data === 'object') {
      const nested = o.data as { items?: unknown };
      if (Array.isArray(nested.items)) return nested.items as PublicPortfolioItem[];
    }
  }
  return [];
}

export type HomepageData = {
  featuredItems: PublicPortfolioItem[];
  categories: PortfolioCategorySummary[];
  blogPosts: PublicBlogPost[];
};

export async function loadHomepageData(): Promise<HomepageData> {
  const [featuredResult, categoriesResult, blogResult] = await Promise.allSettled([
    fetchGatewayJson<PublicPortfolioItem[] | { data: PublicPortfolioItem[] }>(
      '/portfolio/featured',
      { next: { revalidate: 300 } }
    ),
    fetchGatewayJson('/portfolio/categories', { next: { revalidate: 300 } }),
    listBlogPosts({ page: 1, limit: 3 }),
  ]);

  let featuredItems: PublicPortfolioItem[] = [];
  if (featuredResult.status === 'fulfilled') {
    featuredItems = parsePortfolioItems(featuredResult.value);
  }

  if (featuredItems.length === 0) {
    try {
      const published = await fetchGatewayJson<PortfolioListResult>('/portfolio?page=1&limit=12', {
        next: { revalidate: 300 },
      });
      featuredItems = parsePortfolioItems(published);
    } catch {
      // Keep empty — homepage shows placeholder.
    }
  }

  let categories: PortfolioCategorySummary[] = [];
  if (categoriesResult.status === 'fulfilled') {
    categories = parsePortfolioCategories(categoriesResult.value);
  }

  let blogPosts: PublicBlogPost[] = [];
  if (blogResult.status === 'fulfilled') {
    const result = blogResult.value as BlogListResult;
    blogPosts = result.items ?? [];
  }

  return { featuredItems, categories, blogPosts };
}
