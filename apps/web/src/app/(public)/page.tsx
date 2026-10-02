import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button, Container, FigLabel } from '@nestlancer/ui';
import { BRAND, routes } from '@nestlancer/constants';

import { BlogPostCard } from '@/features/blog/components/BlogPostCard';
import { Reveal, Stagger, StaggerItem, ZigReveal } from '@/components/motion/MotionPrimitives';
import {
  FALLBACK_CATEGORIES,
  buildGlobalStats,
  buildPlatformStats,
  PROCESS_STEPS,
  TRUST_LOGOS,
} from '@/features/marketing/homepage-static';
import { loadHomepageData } from '@/features/marketing/load-homepage-data';
import { HomepagePrimaryCta } from '@/features/marketing/HomepagePrimaryCta';
import { MobileStickyCta } from '@/features/marketing/mobile-sticky-cta';
import { PublicHomeHero } from '@/features/marketing/PublicHomeHero';
import { PortfolioFeaturedCarousel } from '@/features/portfolio/PortfolioFeaturedCarousel';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.longDescription,
  path: '/',
});

function SectionLabel({ children }: { children: ReactNode }) {
  return <FigLabel>{children}</FigLabel>;
}

export default async function LandingPage() {
  const homepageData = await loadHomepageData();
  const { featuredItems, categories, blogPosts } = homepageData;
  const platformStats = buildPlatformStats(homepageData);
  const globalStats = buildGlobalStats(homepageData);
  const categoryLabels =
    categories.length > 0 ? categories.map((c) => c.name) : [...FALLBACK_CATEGORIES];
  const featuredPost = blogPosts[0];
  const morePosts = blogPosts.slice(1, 3);

  return (
    <>
      <div className="pb-20 md:pb-0">
        {/* Hero */}
        <section className="hero-orbs relative overflow-hidden py-20 lg:py-28">
          <Container className="relative z-10">
            <PublicHomeHero />
          </Container>
        </section>

        {/* Stats band */}
        <section
          className="section-y-md border-y border-border/40 bg-surface-muted/40"
          aria-label="Platform metrics"
        >
          <Container>
            <Stagger className="grid grid-cols-2 gap-12 sm:grid-cols-4">
              {platformStats.map((stat) => (
                <StaggerItem key={stat.label} className="text-center">
                  <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* Trust logos */}
        <section className="trust-strip section-y-sm" aria-label="Trusted by" aria-hidden>
          <div className="trust-marquee">
            <div className="trust-marquee__track px-4">
              {[...TRUST_LOGOS, ...TRUST_LOGOS].map((name, i) => (
                <span key={`${name}-${i}`}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Bento features */}
        <section id="features" className="section-y-lg">
          <Container>
            <Reveal className="mb-12 max-w-2xl">
              <SectionLabel>Why Nestlancer</SectionLabel>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
                One workspace from brief to delivery
              </h2>
            </Reveal>

            <Stagger className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[160px]">
              <StaggerItem className="md:col-span-2 md:row-span-2">
                <div className="relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
                      Quotes → Pay → Delivery
                    </h3>
                    <p className="mt-3 max-w-md text-muted-foreground">
                      One unified flow for high-stakes product work — requests, quotes, milestone
                      payments, delivery tracking, and handoff without scattered tools.
                    </p>
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-semibold">Dedicated studio</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    One operator, one workflow — direct collaboration from brief through delivery.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-semibold">Milestone payments</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pay deposit, mid, and final installments securely via Razorpay as work
                    progresses.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem className="md:col-span-2">
                <div className="flex h-full flex-col justify-end rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <div className="mb-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-semibold">Portfolio proof</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Case studies and featured work clients can trust — live from our portfolio API.
                  </p>
                </div>
              </StaggerItem>
            </Stagger>
          </Container>
        </section>

        {/* Process */}
        <section
          id="how-it-works"
          className="section-y-lg border-y border-border/40 bg-surface-muted/30"
        >
          <Container>
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
                How we work together
              </h2>
            </Reveal>
            <div className="mx-auto max-w-2xl divide-y divide-border/60">
              {PROCESS_STEPS.map((step, i) => (
                <ZigReveal key={step.step} index={i}>
                  <div className="grid grid-cols-[4rem_1fr] gap-6 py-10">
                    <span className="font-mono text-4xl font-extralight text-primary">
                      {step.step}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </ZigReveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Categories */}
        <section className="section-y-md border-y border-border/40 bg-surface-muted/50">
          <Container>
            <Reveal>
              <SectionLabel>Browse by capability</SectionLabel>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
                Studio capabilities across disciplines
              </h2>
            </Reveal>
            <Stagger className="mt-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:flex-wrap">
              {categoryLabels.map((cat) => (
                <StaggerItem key={cat}>
                  <Link
                    href={routes.portfolio}
                    className="whitespace-nowrap rounded-full border border-border bg-surface px-6 py-2 text-sm font-medium shadow-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {cat}
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* Featured portfolio */}
        <section className="section-y-lg">
          <Container>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionLabel>Featured work</SectionLabel>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
                  Selected client projects
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Selected work from the Nestlancer studio portfolio.
                </p>
              </div>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href={routes.portfolio}>View all projects &rarr;</Link>
              </Button>
            </div>

            {featuredItems.length > 0 ? (
              <PortfolioFeaturedCarousel items={featuredItems} />
            ) : (
              <div className="rounded-2xl border border-border bg-surface-muted p-8 text-center">
                <p className="text-lg font-semibold">Selected work is on the way</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse the portfolio for published case studies.
                </p>
                <Button asChild variant="outline" className="mt-6">
                  <Link href={routes.portfolio}>Browse portfolio</Link>
                </Button>
              </div>
            )}
          </Container>
        </section>

        {/* Blog highlights */}
        {blogPosts.length > 0 ? (
          <section className="section-y-lg">
            <Container>
              <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <SectionLabel>From the journal</SectionLabel>
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
                    Latest insights
                  </h2>
                </div>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href={routes.blog}>View all articles &rarr;</Link>
                </Button>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                {featuredPost ? (
                  <BlogPostCard post={featuredPost} variant="featured" className="h-full" />
                ) : null}
                <div className="flex flex-col gap-6">
                  {morePosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} variant="horizontal" />
                  ))}
                </div>
              </div>
            </Container>
          </section>
        ) : null}

        {/* Global stats */}
        <section className="stats-band section-y-md" aria-label="Platform reach">
          <Container className="text-center">
            <Reveal>
              <h2 className="stats-band__title font-[family-name:var(--font-display)] text-2xl font-semibold">
                Trusted by teams that ship
              </h2>
              <Stagger className="mt-10 flex flex-wrap justify-center gap-12 sm:gap-16">
                {globalStats.map((stat) => (
                  <StaggerItem key={stat.label}>
                    <p className="stats-band__value text-3xl font-semibold">{stat.value}</p>
                    <p className="stats-band__label mt-1 text-sm">{stat.label}</p>
                  </StaggerItem>
                ))}
              </Stagger>
            </Reveal>
          </Container>
        </section>

        {/* CTA band */}
        <section className="cta-band section-y-md">
          <Container className="relative z-10">
            <Reveal className="flex flex-col items-center space-y-8 text-center">
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold sm:text-5xl">
                Ready to ship?
              </h2>
              <p className="max-w-lg text-lg text-muted-foreground">
                Post your first request and receive a studio quote — typically within 24 hours.
              </p>
              <HomepagePrimaryCta
                className="h-14 px-10 text-lg shadow-sm transition-transform hover:-translate-y-0.5"
                guestLabel="Post your first request"
                authenticatedLabel="Open dashboard"
              />
            </Reveal>
          </Container>
        </section>
      </div>

      <MobileStickyCta />
    </>
  );
}
