import type { Metadata } from 'next';

import type { BlogCategorySummary, BlogListResult, PublicBlogPost } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';

import { BlogHireCta } from '@/features/blog/components/BlogHireCta';
import { BlogListingShell } from '@/features/blog/components/BlogListingShell';
import { BlogListingToolbar } from '@/features/blog/components/BlogListingToolbar';
import { BlogNewsletterCta } from '@/features/blog/components/BlogNewsletterCta';
import { BlogPagination } from '@/features/blog/components/BlogPagination';
import { BlogPostCard } from '@/features/blog/components/BlogPostCard';
import { BlogSidebar } from '@/features/blog/components/BlogSidebar';
import { listBlogPosts } from '@nestlancer/api-client';

import { fetchGatewayJson } from '@/lib/gateway-fetch';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog',
  description:
    'Product updates and studio insights — practical writing for teams who ship with Nestlancer.',
  path: '/blog',
  keywords: [
    'Nestlancer blog',
    'product studio insights',
    'software development articles',
    'web development India',
  ],
});

const PAGE_SIZE = 12;

const CATEGORY_FALLBACK_DESCRIPTIONS: Record<string, string> = {
  'case-studies': 'Project retrospectives, delivery playbooks, and lessons from shipped work.',
  technology: 'Engineering deep-dives, architecture notes, and tooling that keeps releases calm.',
  design: 'UI/UX craft, product systems, and design decisions that survive handoff.',
  business: 'Studio operations, hiring playbooks, and client-delivery insights.',
};

function categoryDescription(category: BlogCategorySummary | undefined, label: string): string {
  const fromApi = category?.description?.trim();
  if (fromApi) return fromApi;
  const slug = category?.slug;
  if (slug) {
    const fallback = CATEGORY_FALLBACK_DESCRIPTIONS[slug];
    if (fallback) return fallback;
  }
  return `Articles in ${label}.`;
}

function parseCategories(raw: unknown): BlogCategorySummary[] {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown[] }).items)
      ? (raw as { items: unknown[] }).items
      : Array.isArray((raw as { data?: unknown[] }).data)
        ? (raw as { data: unknown[] }).data
        : [];
  const out: BlogCategorySummary[] = [];
  for (const row of arr) {
    const o = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const id = String(o.id ?? '');
    const name = String(o.name ?? o.title ?? '');
    const slug = String(o.slug ?? id);
    if (!id || !name) continue;
    const postCount =
      typeof o.postCount === 'number'
        ? o.postCount
        : typeof o._count === 'object' &&
            o._count &&
            typeof (o._count as { posts?: number }).posts === 'number'
          ? (o._count as { posts: number }).posts
          : undefined;
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
  searchParams: { page?: string; category?: string };
};

export default async function BlogListingPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const categorySlug = searchParams.category?.trim() || null;

  const categoriesPromise = fetchGatewayJson('/blog/categories', { next: { revalidate: 300 } })
    .then((raw) => parseCategories(raw))
    .catch(() => [] as BlogCategorySummary[]);

  let categories: BlogCategorySummary[] = [];
  let result: BlogListResult = {
    items: [],
    totalItems: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  };
  let loadError: string | null = null;

  if (!categorySlug) {
    // Default list does not need a category id, so the two reads overlap.
    const [loadedCategories, loadedPosts] = await Promise.all([
      categoriesPromise,
      listBlogPosts({ page, limit: PAGE_SIZE }).catch(() => null),
    ]);
    categories = loadedCategories;
    if (loadedPosts) result = loadedPosts;
    else loadError = 'Couldn’t load articles. Please try again.';
  } else {
    try {
      categories = await categoriesPromise;
    } catch {
      categories = [];
    }
  }

  const activeCategory = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;
  const categoryId = activeCategory?.id;

  if (categorySlug) {
    try {
      result = await listBlogPosts({
        page,
        limit: PAGE_SIZE,
        ...(categoryId ? { categoryId } : {}),
      });
    } catch {
      loadError = 'Couldn’t load articles. Please try again.';
    }
  }

  const posts: PublicBlogPost[] = result.items ?? [];
  const featuredPost =
    page === 1 && !categorySlug ? (posts.find((p) => p.featured) ?? posts[0]) : null;
  const gridPosts = featuredPost ? posts.filter((p) => p.id !== featuredPost.id) : posts;

  const categoryLabel = activeCategory?.name ?? null;
  // Sidebar "All articles" should reflect the full catalog, not the active filter page.
  const catalogTotalFromCategories = categories.reduce((sum, c) => sum + (c.postCount ?? 0), 0);
  const totalPostCount =
    catalogTotalFromCategories > 0
      ? catalogTotalFromCategories
      : !categorySlug
        ? result.totalItems
        : result.totalItems;
  const listTotal = result.totalItems;
  const totalPages = Math.max(
    result.totalPages,
    listTotal > 0 ? Math.ceil(listTotal / Math.max(result.limit, 1)) : 0
  );
  const rangeStart = posts.length === 0 ? 0 : (result.page - 1) * result.limit + 1;
  const rangeEnd = posts.length === 0 ? 0 : rangeStart + posts.length - 1;

  return (
    <BlogListingShell
      sidebar={
        <BlogSidebar
          categories={categories}
          totalPostCount={totalPostCount}
          activeCategorySlug={categorySlug}
        />
      }
    >
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {categoryLabel ?? 'Latest articles'}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {categoryLabel
                ? categoryDescription(activeCategory, categoryLabel)
                : 'Hiring playbooks, engineering deep-dives, and studio insights — filtered by category.'}
            </p>
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
              href={
                categorySlug
                  ? `${routes.blog}?category=${encodeURIComponent(categorySlug)}`
                  : routes.blog
              }
              className="inline-flex font-medium underline-offset-4 hover:underline"
            >
              Try again
            </a>
          </div>
        ) : null}

        {posts.length === 0 && !loadError ? (
          <p className="mt-16 text-center text-muted-foreground">
            No published posts yet. Check back soon — we are drafting the first stories.
          </p>
        ) : null}

        {posts.length > 0 ? (
          <>
            <div className="mt-10 flex items-end justify-between gap-4">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {featuredPost && !categorySlug ? 'Featured & latest' : 'Articles'}
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                {totalPages > 1
                  ? `Showing ${rangeStart}–${rangeEnd} of ${listTotal}`
                  : `${listTotal} ${listTotal === 1 ? 'story' : 'stories'}`}
              </p>
            </div>

            {featuredPost ? (
              <div className="mt-6">
                <BlogPostCard post={featuredPost} variant="featured" />
              </div>
            ) : null}

            <div
              className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${featuredPost ? 'mt-5' : 'mt-6'}`}
            >
              {gridPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>

            <BlogPagination
              basePath={routes.blog}
              page={result.page}
              totalPages={totalPages}
              categorySlug={categorySlug}
            />
          </>
        ) : null}

        <div className="mt-16 max-w-2xl">
          <BlogNewsletterCta />
        </div>
      </div>
    </BlogListingShell>
  );
}
