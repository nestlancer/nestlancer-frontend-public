import Link from 'next/link';

import { routes } from '@nestlancer/constants';
import type { PublicPortfolioItem } from '@nestlancer/types';
import { FigLabel } from '@nestlancer/ui';
import { formatPortfolioProjectDate, safeNavigationUrl } from '@nestlancer/utils';

export function PortfolioCaseStudyHero({ item }: { item: PublicPortfolioItem }) {
  const dateLabel = formatPortfolioProjectDate(item);
  const thumb = safeNavigationUrl(item.thumbnailUrl);

  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-surface-muted" aria-hidden>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" fetchPriority="high" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/25 via-surface-muted to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/78 to-background/25" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
        <Link
          href={routes.portfolio}
          className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-background"
        >
          ← Portfolio
        </Link>

        <div className="mt-10 max-w-3xl">
          <FigLabel>{item.category?.name ?? 'Case study'}</FigLabel>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            {item.title}
          </h1>
          {item.shortDescription ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {item.shortDescription}
            </p>
          ) : null}
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {dateLabel}
            {item.client?.name ? (
              <>
                <span className="mx-2 text-border">/</span>
                {item.client.name}
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
