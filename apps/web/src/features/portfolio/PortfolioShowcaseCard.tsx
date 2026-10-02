'use client';

import Link from 'next/link';

import type { PublicPortfolioItem } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';
import { safeNavigationUrl } from '@nestlancer/utils';

import { SoftTilt, ZigReveal } from '@/components/motion/MotionPrimitives';

type PortfolioShowcaseCardProps = {
  item: PublicPortfolioItem;
  className?: string;
  index?: number;
};

export function PortfolioShowcaseCard({
  item,
  className = '',
  index = 0,
}: PortfolioShowcaseCardProps) {
  const href = routes.portfolioItem(item.slug || item.id);
  const thumb = safeNavigationUrl(item.thumbnailUrl);

  return (
    <ZigReveal index={index} className={className}>
      <SoftTilt delay={Math.min(index, 4) * 0.04}>
        <Link href={href} className="group block h-full">
          <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--elevation-1,0_1px_2px_rgb(0_0_0/0.04))] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--elevation-2)]">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface-muted">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt={item.title ? `${item.title} thumbnail` : 'Portfolio project'}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                {item.category?.name ?? 'Portfolio'}
              </p>
              <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                {item.title}
              </h3>
              {item.shortDescription ? (
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {item.shortDescription}
                </p>
              ) : null}
              {(item.likeCount != null && item.likeCount > 0) ||
              (item.viewCount != null && item.viewCount > 0) ? (
                <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
                  {item.likeCount != null && item.likeCount > 0 ? (
                    <span>♥ {item.likeCount}</span>
                  ) : null}
                  {item.viewCount != null && item.viewCount > 0 ? (
                    <span>
                      {item.viewCount.toLocaleString()} {item.viewCount === 1 ? 'view' : 'views'}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        </Link>
      </SoftTilt>
    </ZigReveal>
  );
}
