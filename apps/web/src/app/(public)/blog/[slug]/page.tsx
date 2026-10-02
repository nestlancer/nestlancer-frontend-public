import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { PublicBlogPost } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';

import { BlogArticleContextRail } from '@/features/blog/components/BlogArticleContextRail';
import { BlogArticleShell } from '@/features/blog/components/BlogArticleShell';
import { BlogArticleToc } from '@/features/blog/components/BlogArticleToc';
import { BlogEditorialByline } from '@/features/blog/components/BlogEditorialByline';
import { BlogHireCta } from '@/features/blog/components/BlogHireCta';
import { BlogMarkdown } from '@/features/blog/components/BlogMarkdown';
import { BlogMobileToc } from '@/features/blog/components/BlogMobileToc';
import { BlogNewsletterCta } from '@/features/blog/components/BlogNewsletterCta';
import { BlogPrevNext } from '@/features/blog/components/BlogPrevNext';
import { BlogReadingProgress } from '@/features/blog/components/BlogReadingProgress';
import { BlogRelatedGrid } from '@/features/blog/components/BlogRelatedGrid';
import { BlogPostReadMeta } from '@/features/blog/components/BlogPostReadMeta';
import { BlogShareRail } from '@/features/blog/components/BlogShareRail';
import { BlogPostInteractionsClient } from '@/features/blog/BlogPostInteractionsClient';
import {
  extractMarkdownToc,
  postCoverImage,
  postSeoDescription,
  postSeoTitle,
  stripLeadingTitleHeading,
} from '@/features/blog/blog-utils';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  fetchGatewayJson,
  GatewayFetchError,
  isGatewayMaintenanceError,
} from '@/lib/gateway-fetch';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';

type RelatedRow = Pick<
  PublicBlogPost,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'publishedAt'
  | 'readingTime'
  | 'category'
  | 'seo'
  | 'author'
  | 'featured'
>;

export const revalidate = 300;

type Props = { params: { slug: string } };

const fetchPost = cache(async (slug: string): Promise<PublicBlogPost> => {
  return fetchGatewayJson<PublicBlogPost>(`/blog/posts/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300 },
  });
});

const fetchRelated = cache(async (slug: string): Promise<RelatedRow[]> => {
  try {
    const rel = await fetchGatewayJson<RelatedRow[] | { data: RelatedRow[] }>(
      `/blog/posts/${encodeURIComponent(slug)}/related?limit=4`,
      { next: { revalidate: 300 } }
    );
    if (Array.isArray(rel)) return rel;
    if (rel && typeof rel === 'object' && 'data' in rel) return rel.data;
    return [];
  } catch {
    return [];
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await fetchPost(params.slug);
    const title = postSeoTitle(post);
    const description = postSeoDescription(post);
    const cover = postCoverImage(post);
    return buildPageMetadata({
      title,
      description,
      path: routes.blogPost(post.slug),
      image: cover ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
    });
  } catch (error) {
    if (error instanceof GatewayFetchError && error.status === 429) {
      return buildPageMetadata({
        title: 'Temporarily unavailable',
        description: 'This article is temporarily unavailable. Please try again shortly.',
        path: routes.blogPost(params.slug),
        noIndex: true,
      });
    }
    return { title: 'Post not found' };
  }
}

export default async function BlogPostPage({ params }: Props) {
  let post: PublicBlogPost;
  let related: RelatedRow[] = [];
  try {
    const loaded = await Promise.all([fetchPost(params.slug), fetchRelated(params.slug)]);
    post = loaded[0];
    related = loaded[1];
    if (!post?.slug || !post?.title) {
      notFound();
    }
  } catch (error) {
    if (isGatewayMaintenanceError(error)) throw error;
    if (error instanceof GatewayFetchError && error.status === 429) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Temporarily unavailable
          </h1>
          <p className="text-sm text-muted-foreground">
            We’re receiving a high volume of requests. Please wait a moment and try again — this
            article is still published.
          </p>
          <Link
            href={routes.blogPost(params.slug)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </Link>
          <Link href={routes.blog} className="text-sm text-primary hover:underline">
            Back to blog
          </Link>
        </div>
      );
    }
    notFound();
  }

  const isHtml = post.contentFormat?.toUpperCase() === 'HTML';
  const tags = post.tags ?? [];
  const markdownBody = !isHtml ? stripLeadingTitleHeading(post.content, post.title) : post.content;
  const toc = !isHtml ? extractMarkdownToc(markdownBody) : [];
  const cover = postCoverImage(post);
  const sharePath = routes.blogPost(post.slug);
  const shareUrl = absoluteUrl(sharePath);
  const description = postSeoDescription(post);
  const authorName = post.author
    ? [post.author.firstName, post.author.lastName].filter(Boolean).join(' ') || 'Nestlancer'
    : 'Nestlancer';

  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <>
      <JsonLd
        nonce={nonce}
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: sharePath },
          ]),
          articleJsonLd({
            title: postSeoTitle(post),
            description,
            path: sharePath,
            image: cover,
            publishedAt: post.publishedAt,
            authorName,
          }),
        ]}
      />
      <BlogReadingProgress />

      <BlogArticleShell
        readMeta={
          <BlogPostReadMeta
            slug={post.slug}
            initialViewCount={post.viewCount ?? 0}
            readingTime={post.readingTime}
          />
        }
        leftRail={
          <>
            <BlogShareRail title={post.title} url={shareUrl} />
            <BlogArticleContextRail category={post.category} />
          </>
        }
        rightRail={toc.length > 0 ? <BlogArticleToc items={toc} /> : null}
      >
        <article>
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-[hsl(var(--article-meta))]"
          >
            <Link href={routes.blog} className="hover:text-article-accent hover:underline">
              Blog
            </Link>
            {post.category ? (
              <>
                <span aria-hidden>/</span>
                <Link
                  href={`${routes.blog}?category=${encodeURIComponent(post.category.slug)}`}
                  className="font-semibold text-article-accent hover:underline"
                >
                  {post.category.name}
                </Link>
              </>
            ) : null}
          </nav>

          <h1 className="mt-4 text-[clamp(1.75rem,5vw,2.75rem)] font-bold leading-[1.15] tracking-tight text-article">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-4 text-lg leading-relaxed text-[hsl(var(--article-muted))]">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-4 border-b border-article pb-6">
            <BlogEditorialByline
              author={post.author}
              publishedAt={post.publishedAt}
              readingTime={post.readingTime}
              commentCount={post.commentCount}
            />
          </div>

          <div className="mt-6 xl:hidden">
            <BlogShareRail title={post.title} url={shareUrl} orientation="horizontal" />
          </div>

          {cover ? (
            <div className="mt-8 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt={post.title} className="aspect-[2/1] w-full object-cover" />
            </div>
          ) : null}

          {toc.length > 0 ? (
            <div className="mt-8 xl:hidden">
              <BlogMobileToc items={toc} />
            </div>
          ) : null}

          <div className="mt-10">
            {isHtml ? (
              <div
                className="article-prose text-[17px] leading-[1.75] text-article-muted [&_a]:text-article-accent [&_code]:rounded [&_code]:bg-article-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#eb5757] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:scroll-mt-28 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-article [&_p]:mb-5"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
              />
            ) : (
              <BlogMarkdown
                content={markdownBody}
                className="text-[17px] leading-[1.75] text-article-muted [&_h2]:scroll-mt-28 [&_h2]:text-article [&_h3]:scroll-mt-28"
              />
            )}
          </div>

          {tags.length > 0 ? (
            <ul className="mt-10 flex flex-wrap gap-2 border-t border-article pt-8">
              {tags.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/blog/tag/${encodeURIComponent(t.slug)}`}
                    className="inline-flex rounded-md border border-article bg-article-muted px-3 py-1 text-xs font-medium text-article-muted transition hover:border-[hsl(var(--article-accent))] hover:text-article-accent"
                  >
                    #{t.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10">
            <BlogHireCta variant="article" />
          </div>

          <div className="mt-10 rounded-xl border border-article bg-[hsl(var(--article-bg))] p-6">
            <BlogPostInteractionsClient
              slug={post.slug}
              initialLikeCount={post.likeCount ?? 0}
              commentsEnabled={post.commentsEnabled !== false}
            />
          </div>

          <BlogRelatedGrid posts={related} />

          <BlogPrevNext previous={post.adjacent?.previous} next={post.adjacent?.next} />
        </article>
      </BlogArticleShell>

      <section className="border-t border-border/60 bg-background px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <BlogNewsletterCta />
        </div>
      </section>
    </>
  );
}
