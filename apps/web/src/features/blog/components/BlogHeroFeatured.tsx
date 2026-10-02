import Link from 'next/link';

import type { PublicBlogPost } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';

import {
  authorDisplayName,
  categoryAccentClass,
  formatBlogDateShort,
  postCoverImage,
  readingTimeLabel,
} from '../blog-utils';

import { publicPanelClass } from '@/lib/public-editorial-classes';

export function BlogHeroFeatured({ post }: { post: PublicBlogPost }) {
  const accent = categoryAccentClass(post.category?.slug);
  const cover = postCoverImage(post);

  return (
    <Link
      href={routes.blogPost(post.slug)}
      className={`group relative block overflow-hidden transition-transform hover:scale-[1.005] ${publicPanelClass}`}
    >
      {cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/20" />
        </>
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-90`} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </>
      )}
      <div className="relative grid gap-6 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary-foreground/90">
            <span className="rounded-full bg-background/20 px-2.5 py-1 backdrop-blur">
              Editor&apos;s pick
            </span>
            {post.category?.name ? (
              <span className="rounded-full bg-background/15 px-2.5 py-1 backdrop-blur">
                {post.category.name}
              </span>
            ) : null}
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
            {post.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
            {post.excerpt}
          </p>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-foreground/75">
            <span>{authorDisplayName(post.author)}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt ?? undefined}>
              {formatBlogDateShort(post.publishedAt)}
            </time>
            {post.readingTime ? (
              <>
                <span aria-hidden>·</span>
                <span>{readingTimeLabel(post.readingTime)}</span>
              </>
            ) : null}
          </p>
        </div>
        <span className="inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-semibold text-foreground shadow-sm transition group-hover:bg-primary group-hover:text-primary-foreground">
          Read article →
        </span>
      </div>
    </Link>
  );
}
