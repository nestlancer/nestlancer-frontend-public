import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { routes } from '@nestlancer/constants';
import type { PublicPortfolioItem } from '@nestlancer/types';
import { JsonLd } from '@/components/seo/JsonLd';
import { fetchGatewayJson, isGatewayMaintenanceError } from '@/lib/gateway-fetch';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { BlogMarkdown } from '@/features/blog/components/BlogMarkdown';
import { PortfolioLikeButton } from '@/features/portfolio/PortfolioLikeButton';
import { PortfolioViewMeta } from '@/features/portfolio/PortfolioViewMeta';
import { PortfolioCaseStudyHero } from '@/features/portfolio/PortfolioCaseStudyHero';
import { PortfolioCaseStudySections } from '@/features/portfolio/PortfolioCaseStudySections';
import { breadcrumbJsonLd, buildPageMetadata, creativeWorkJsonLd } from '@/lib/seo';

export const revalidate = 300;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const item = await fetchGatewayJson<PublicPortfolioItem>(
      `/portfolio/${encodeURIComponent(params.id)}`,
      { next: { revalidate: 300 } }
    );
    const description =
      item.shortDescription || `Case study: ${item.title} by the Nestlancer studio.`;
    return buildPageMetadata({
      title: item.title,
      description,
      path: routes.portfolioItem(params.id),
      image: item.thumbnailUrl ?? undefined,
    });
  } catch {
    return { title: 'Case study not found' };
  }
}

export default async function PortfolioDetailPage({ params }: Props) {
  let item: PublicPortfolioItem;
  try {
    item = await fetchGatewayJson<PublicPortfolioItem>(
      `/portfolio/${encodeURIComponent(params.id)}`,
      {
        next: { revalidate: 300 },
      }
    );
  } catch (error) {
    // Maintenance / gateway outage should not look like a missing case study.
    if (isGatewayMaintenanceError(error)) throw error;
    notFound();
  }

  const tags = Array.isArray(item.tags) ? item.tags : [];
  const description = item.shortDescription || `Case study: ${item.title}`;

  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <article>
      <JsonLd
        nonce={nonce}
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Portfolio', path: '/portfolio' },
            { name: item.title, path: routes.portfolioItem(params.id) },
          ]),
          creativeWorkJsonLd({
            title: item.title,
            description,
            path: routes.portfolioItem(params.id),
            image: item.thumbnailUrl,
            datePublished: item.publishedAt,
            keywords: tags,
          }),
        ]}
      />

      <PortfolioCaseStudyHero item={item} />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-6 text-xs text-muted-foreground">
          {item.category?.name ? (
            <span className="rounded-full border border-border bg-surface px-3 py-1">
              {item.category.name}
            </span>
          ) : null}
          {tags.slice(0, 8).map((tag) => (
            <span key={tag} className="rounded-full border border-border bg-surface px-3 py-1">
              {tag}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2">
            <PortfolioViewMeta idOrSlug={params.id} initialViewCount={item.viewCount ?? 0} />
            <PortfolioLikeButton
              itemId={item.id}
              idOrSlug={params.id}
              initialCount={item.likeCount ?? 0}
            />
          </span>
        </div>

        <section className="mt-10 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Overview</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            What we shipped
          </h2>
          {item.fullDescription ? (
            item.contentFormat?.toUpperCase() === 'HTML' ? (
              <div
                className="prose mt-5 max-w-none text-sm dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.fullDescription) }}
              />
            ) : (
              <BlogMarkdown
                content={item.fullDescription}
                className="prose mt-5 max-w-none text-sm dark:prose-invert"
              />
            )
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No full description for this item.</p>
          )}
        </section>

        <PortfolioCaseStudySections item={item} />
      </div>
    </article>
  );
}
