import Link from 'next/link';

import { routes } from '@nestlancer/constants';
import type { PublicPortfolioItem } from '@nestlancer/types';
import { EngineeredPanel } from '@nestlancer/ui';
import { safeNavigationUrl } from '@nestlancer/utils';

import {
  isPortfolioReviewVisible,
  PortfolioClientReviewSection,
} from '@/features/portfolio/PortfolioClientReview';

export function PortfolioCaseStudySections({ item }: { item: PublicPortfolioItem }) {
  const technologies = item.projectDetails?.technologies ?? [];
  const stats = item.stats ?? null;
  const gallery = item.gallery ?? [];
  const documents = item.documents ?? [];
  const videos = item.videos ?? [];
  const featuredVideoUrl = item.featuredVideoUrl;
  const clientReview = isPortfolioReviewVisible(item.client?.testimonial)
    ? item.client!.testimonial!
    : null;

  return (
    <div className="mt-12 space-y-12">
      {clientReview ? <PortfolioClientReviewSection review={clientReview} /> : null}

      {featuredVideoUrl && safeNavigationUrl(featuredVideoUrl) ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Showcase video</h2>
          <video
            src={safeNavigationUrl(featuredVideoUrl) ?? undefined}
            controls
            className="mt-4 max-h-[28rem] w-full rounded-2xl border border-border bg-black"
          >
            <track kind="captions" />
          </video>
        </section>
      ) : null}

      {videos.length > 0 && !featuredVideoUrl ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Videos</h2>
          <div className="mt-4 space-y-4">
            {videos.map((video) =>
              video.url && safeNavigationUrl(video.url) ? (
                <div key={video.mediaId}>
                  {video.title ? <p className="mb-2 text-sm font-medium">{video.title}</p> : null}
                  <video
                    src={safeNavigationUrl(video.url) ?? undefined}
                    controls
                    className="max-h-96 w-full rounded-2xl border border-border bg-black"
                  >
                    <track kind="captions" />
                  </video>
                </div>
              ) : null
            )}
          </div>
        </section>
      ) : null}

      {item.client?.name ? (
        <EngineeredPanel as="section" className="p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold tracking-tight">Client</h2>
          <p className="mt-2 text-sm font-medium">{item.client.name}</p>
          {item.client.industry ? (
            <p className="mt-1 text-sm text-muted-foreground">{item.client.industry}</p>
          ) : null}
          {item.client.website && safeNavigationUrl(item.client.website) ? (
            <a
              href={safeNavigationUrl(item.client.website) ?? undefined}
              className="mt-2 inline-block text-sm text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit website
            </a>
          ) : null}
        </EngineeredPanel>
      ) : null}

      {gallery.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Gallery</h2>
          <div
            className={
              gallery.length === 1
                ? 'mt-5 max-w-3xl'
                : 'mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
            }
          >
            {gallery.map((img) =>
              img.url && safeNavigationUrl(img.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.mediaId}
                  src={safeNavigationUrl(img.url) ?? undefined}
                  alt={img.alt ?? ''}
                  className="h-48 w-full rounded-2xl border border-border object-cover sm:h-56"
                  loading="lazy"
                />
              ) : null
            )}
          </div>
        </section>
      ) : null}

      {documents.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Documents &amp; downloads
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {documents.map((doc) =>
              doc.url && safeNavigationUrl(doc.url) ? (
                <li key={doc.mediaId}>
                  <a
                    href={safeNavigationUrl(doc.url) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:border-primary/40"
                  >
                    <span className="font-medium">{doc.title ?? 'Download file'}</span>
                    {doc.mimeType ? (
                      <span className="ml-auto text-xs text-muted-foreground">{doc.mimeType}</span>
                    ) : null}
                  </a>
                </li>
              ) : null
            )}
          </ul>
        </section>
      ) : null}

      {technologies.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Tech stack</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {stats && Object.keys(stats).length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Results</h2>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-border bg-surface p-5">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {key}
                </dt>
                <dd className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {item.links?.live || item.links?.github ? (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Links</h2>
          <ul className="mt-4 flex flex-wrap gap-3 text-sm">
            {item.links.live && safeNavigationUrl(item.links.live) ? (
              <li>
                <a
                  href={safeNavigationUrl(item.links.live) ?? undefined}
                  className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-medium text-primary hover:bg-primary/15"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Live project
                </a>
              </li>
            ) : null}
            {item.links.github && safeNavigationUrl(item.links.github) ? (
              <li>
                <a
                  href={safeNavigationUrl(item.links.github) ?? undefined}
                  className="inline-flex rounded-full border border-border bg-surface px-4 py-2 font-medium hover:border-primary/40"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source code
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-primary/30 bg-primary/5 px-6 py-10 text-center sm:px-10">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Interested in similar work?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Tell us about your project — we can scope something inspired by this case study.
        </p>
        <Link
          href={`${routes.contact}?ref=${encodeURIComponent(item.ctaReferenceId ?? item.id)}`}
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Start a similar project
        </Link>
      </section>
    </div>
  );
}
