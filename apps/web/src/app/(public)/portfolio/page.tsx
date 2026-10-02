import type { Metadata } from 'next';
import Link from 'next/link';
import type { PortfolioListResult, PortfolioTimelineResult } from '@nestlancer/types';
import { Button, Container, FigLabel, PortfolioTimeline } from '@nestlancer/ui';
import { routes } from '@nestlancer/constants';

import { PortfolioHero } from '@/features/portfolio/PortfolioHero';
import { toTimelineEntries } from '@/features/portfolio/portfolio-timeline';
import { fetchGatewayJson } from '@/lib/gateway-fetch';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: 'Portfolio',
  description:
    'Selected Nestlancer studio case studies — web, mobile, e-commerce, and UX work delivered for clients.',
  path: '/portfolio',
  keywords: [
    'Nestlancer portfolio',
    'case studies',
    'web development projects',
    'mobile app case study',
    'UI UX portfolio',
  ],
});

function yearSpanFromEntries(entries: ReturnType<typeof toTimelineEntries>): string | null {
  const years = [
    ...new Set(entries.map((entry) => entry.year).filter((year): year is string => Boolean(year))),
  ].sort();
  const first = years[0];
  const last = years[years.length - 1];
  if (!first) return null;
  if (!last || first === last) return first;
  return `${first} — ${last}`;
}

export default async function PortfolioListingPage() {
  let timelineEntries: ReturnType<typeof toTimelineEntries> = [];
  let loadError: string | null = null;

  try {
    const list = await fetchGatewayJson<PortfolioListResult>('/portfolio?page=1&limit=48', {
      next: { revalidate: 300 },
    });
    timelineEntries = toTimelineEntries(list.items ?? []);
  } catch {
    try {
      const timeline = await fetchGatewayJson<PortfolioTimelineResult>('/portfolio/timeline', {
        next: { revalidate: 300 },
      });
      timelineEntries = toTimelineEntries(timeline.items ?? []);
    } catch {
      loadError = 'Could not load portfolio. Please try again later.';
    }
  }

  return (
    <>
      <PortfolioHero
        projectCount={timelineEntries.length}
        yearSpan={yearSpanFromEntries(timelineEntries)}
      />

      <Container className="py-12 sm:py-16">
        {loadError ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        <div className="mb-10 flex items-end justify-between gap-4 border-b border-border/60 pb-4 sm:mb-14">
          <div>
            <FigLabel>FIG · Timeline</FigLabel>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Project timeline
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Newest first. Each node lights as it enters view — open a card for the full case
              study.
            </p>
          </div>
        </div>

        <PortfolioTimeline
          entries={timelineEntries}
          variant="public"
          emptyMessage="No published projects yet. Check back soon."
        />

        {timelineEntries.length > 0 ? (
          <section className="mt-20 rounded-2xl border border-primary/25 bg-primary/5 px-6 py-10 text-center sm:px-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Want work like this?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Tell us about the product. We will come back with a scoped studio quote.
            </p>
            <Button asChild className="mt-6">
              <Link href={routes.contact}>Start a project</Link>
            </Button>
          </section>
        ) : null}
      </Container>
    </>
  );
}
