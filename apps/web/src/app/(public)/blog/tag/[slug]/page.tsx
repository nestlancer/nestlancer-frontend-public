import type { Metadata } from 'next';

import type { BlogCategorySummary, BlogListResult, PublicBlogPost } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';
import { listBlogPosts } from '@nestlancer/api-client';

import { BlogHireCta } from '@/features/blog/components/BlogHireCta';
import { BlogListingShell } from '@/features/blog/components/BlogListingShell';
import { BlogListingToolbar } from '@/features/blog/components/BlogListingToolbar';
import { BlogPagination } from '@/features/blog/components/BlogPagination';
import { BlogPostCard } from '@/features/blog/components/BlogPostCard';
import { BlogSidebar } from '@/features/blog/components/BlogSidebar';
import { fetchGatewayJson } from '@/lib/gateway-fetch';

export const revalidate = 300;

const PAGE_SIZE = 12;

function parseCategories(raw: unknown): BlogCategorySummary[] {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown[] }).items)
      ? (raw as { items: unknown[] }).items
      : [];
  const out: BlogCategorySummary[] = [];
  for (const row of arr) {
    const o = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const id = String(o.id ?? '');
    const name = String(o.name ?? o.title ?? '');
    const slug = String(o.slug ?? id);
    if (!id || !name) continue;
    out.push({ id, name, slug });
  }
  return out;
}

type PageProps = {
  params: { slug: string };
  searchParams: { page?: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `#${params.slug.replace(/-/g, ' ')} | Nestlancer Blog`,
    description: `Posts tagged with ${params.slug.replace(/-/g, ' ')}.`,
  };
}

export default async function BlogTagPage({ params, searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const slug = params.slug.trim();

  let categories: BlogCategorySummary[] = [];
  try {
    categories = parseCategories(
      await fetchGatewayJson('/blog/categories', { next: { revalidate: 300 } })
    );
  } catch {
    categories = [];
  }

  let result: BlogListResult = {
    items: [],
    totalItems: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  };
  let loadError: string | null = null;

  try {
    result = await listBlogPosts({ page, limit: PAGE_SIZE, tag: slug });
  } catch {
    loadError = 'Could not load posts for this tag.';
  }

  const posts: PublicBlogPost[] = result.items ?? [];

  return (
    <BlogListingShell
      sidebar={
        <BlogSidebar
          categories={categories}
          totalPostCount={result.totalItems}
          activeCategorySlug={null}
        />
      }
    >
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              #{slug.replace(/-/g, ' ')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Tag archive</p>
          </div>
          <BlogListingToolbar />
        </div>
        <div className="mt-8">
          <BlogHireCta />
        </div>
        {loadError ? (
          <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}
        {posts.length > 0 ? (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
            <BlogPagination
              basePath={`${routes.blog}/tag/${slug}`}
              page={result.page}
              totalPages={result.totalPages}
            />
          </>
        ) : !loadError ? (
          <p className="mt-16 text-center text-muted-foreground">No posts with this tag yet.</p>
        ) : null}
      </div>
    </BlogListingShell>
  );
}
