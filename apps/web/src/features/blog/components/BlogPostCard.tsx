import Link from 'next/link';

import type { PublicBlogPost } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';

import { cn } from '@nestlancer/ui';

import { publicListCardClass } from '@/lib/public-editorial-classes';

import {
  authorDisplayName,
  categoryAccentClass,
  postCardFooterMeta,
  postCoverImage,
  postMetaLine,
} from '../blog-utils';

type Props = {
  post: PublicBlogPost;
  variant?: 'default' | 'compact' | 'horizontal' | 'featured';
  className?: string;
};

function CardCover({
  post,
  accent,
  tall,
}: {
  post: PublicBlogPost;
  accent: string;
  tall?: boolean;
}) {
  const src = postCoverImage(post);

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        tall ? 'aspect-[2/1] sm:aspect-[21/9]' : 'aspect-[16/9]'
      )}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        </>
      ) : (
        <div className={cn('h-full w-full bg-gradient-to-br', accent)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground)/0.12),transparent_55%)]" />
        </div>
      )}
      {post.featured ? (
        <span className="absolute left-3 top-3 z-[1] rounded-full bg-brand-coral px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Featured
        </span>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
    </div>
  );
}

export function BlogPostCard({ post, variant = 'default', className }: Props) {
  const meta = postMetaLine(post);
  const cardMeta = postCardFooterMeta(post);
  const accent = categoryAccentClass(post.category?.slug);

  if (variant === 'horizontal') {
    const src = postCoverImage(post);
    return (
      <Link
        href={routes.blogPost(post.slug)}
        className={cn(
          'group flex gap-4 p-4 transition-all hover:border-primary/30 hover:shadow-theme-sm',
          publicListCardClass,
          className
        )}
      >
        <div
          className={cn(
            'relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-border/60',
            !src && `bg-gradient-to-br ${accent}`
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {post.category?.name ?? 'Article'}
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold leading-snug group-hover:text-primary">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
          <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={routes.blogPost(post.slug)}
        className={cn(
          'group block rounded-xl border border-border/60 bg-surface/50 p-4 transition-colors hover:border-primary/35',
          className
        )}
      >
        <h3 className="font-semibold leading-snug group-hover:text-primary">{post.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </Link>
    );
  }

  const isFeatured = variant === 'featured';

  return (
    <Link
      href={routes.blogPost(post.slug)}
      className={cn(
        'group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-theme-sm',
        publicListCardClass,
        className
      )}
    >
      <CardCover post={post} accent={accent} tall={isFeatured} />
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
          {post.category?.name ?? 'Article'}
        </p>
        <h3
          className={cn(
            'mt-2 font-display font-semibold leading-snug tracking-tight group-hover:text-primary',
            isFeatured ? 'text-xl sm:text-2xl' : 'text-lg'
          )}
        >
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <span className="truncate">{authorDisplayName(post.author)}</span>
          <span className="flex shrink-0 items-center gap-2 font-mono">
            <span>{cardMeta || meta.split(' · ').slice(-2).join(' · ')}</span>
            <span
              className="text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1"
              aria-hidden
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
