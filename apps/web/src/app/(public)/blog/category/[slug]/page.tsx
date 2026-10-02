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
    const postCount = typeof o.postCount === 'number' ? o.postCount : undefined;
    const description =
      typeof o.description === 'string' && o.description.trim() ? o.description.trim() : undefined;
    out.push({
      id,
      name,
      slug,
      ...(postCount != null ? { postCount } : {}),
      ...(description ? { description } : {}),
    });
  }
  return out;
}

type PageProps = {
  params: { slug: string };
  searchParams: { page?: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `${params.slug.replace(/-/g, ' ')} | Nestlancer Blog`,
    description: `Articles in the ${params.slug.replace(/-/g, ' ')} category.`,
  };
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
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

  const category = categories.find((c) => c.slug === slug);
  const categoryId = category?.id;

  let result: BlogListResult = {
    items: [],
    totalItems: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  };
  let loadError: string | null = null;

  if (categoryId) {
    try {
      result = await listBlogPosts({ page, limit: PAGE_SIZE, categoryId });
    } catch {
      loadError = 'Could not load posts for this category.';
    }
  } else {
    loadError = 'Category not found.';
  }

  const posts: PublicBlogPost[] = result.items ?? [];
  const catalogTotal =
    categories.reduce((sum, c) => sum + (c.postCount ?? 0), 0) || result.totalItems;
  const categoryBlurb =
    category?.description?.trim() || `Articles in ${category?.name ?? slug.replace(/-/g, ' ')}.`;

  return (
    <BlogListingShell
      sidebar={
        <BlogSidebar
          categories={categories}
          totalPostCount={catalogTotal}
          activeCategorySlug={slug}
        />
      }
    >
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {category?.name ?? slug.replace(/-/g, ' ')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{categoryBlurb}</p>
          </div>
          <BlogListingToolbar />
        </div>
        <div className="mt-8">
          <BlogHireCta />
        </div>
        {loadError ? (
          <div className="mt-8 space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>{loadError}</p>
            <a
              href={`${routes.blog}/category/${encodeURIComponent(slug)}`}
              className="inline-flex font-medium underline-offset-4 hover:underline"
            >
              Try again
            </a>
          </div>
        ) : null}
        {posts.length > 0 ? (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
            <BlogPagination
              basePath={`${routes.blog}/category/${slug}`}
              page={result.page}
              totalPages={result.totalPages}
            />
          </>
        ) : !loadError ? (
          <p className="mt-16 text-center text-muted-foreground">No posts in this category yet.</p>
        ) : null}
      </div>
    </BlogListingShell>
  );
}
