import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { BRAND } from '@nestlancer/constants';
import { Container, EngineeredPanel, FigLabel } from '@nestlancer/ui';

import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { Reveal, ZigReveal } from '../../components/motion/MotionPrimitives';
import { JsonLd } from '@/components/seo/JsonLd';
import { PRICING_FAQ } from '@/lib/faq';
import { buildPageMetadata, faqPageJsonLd } from '@/lib/seo';
import { PricingPlans } from './PricingPlans';

export const metadata: Metadata = buildPageMetadata({
  title: 'Pricing',
  description: `Studio packages and custom project quotes from ${BRAND.name}. Milestone payment schedules — no SaaS subscriptions.`,
  path: '/pricing',
  keywords: [
    'Nestlancer pricing',
    'MVP development cost',
    'custom software quote',
    'milestone payments',
    'web application MVP',
  ],
});

export default async function PricingPage() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd nonce={nonce} data={faqPageJsonLd(PRICING_FAQ)} />
      <MarketingHeader />
      <main id="main-content">
        <section className="hero-orbs border-b border-border py-14 md:py-20">
          <Container className="relative z-10 text-center">
            <Reveal className="flex flex-col items-center">
              <div className="intake-badge mx-auto">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--success))]" />
                </span>
                Intake open
              </div>
              <FigLabel>FIG · Engagements</FigLabel>
              <h1 className="mx-auto max-w-[16ch] text-4xl font-bold tracking-[-0.05em] sm:text-5xl">
                Clear engagements. No subscription trap.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Transparent studio packages and custom quotes — pay by milestone as work ships.
              </p>
            </Reveal>
          </Container>
        </section>
        <Container className="py-14 md:py-16">
          <PricingPlans />
        </Container>
        <section
          className="border-t border-border py-14 md:py-16"
          aria-labelledby="pricing-faq-heading"
        >
          <Container className="mx-auto max-w-3xl">
            <Reveal>
              <FigLabel>FIG · FAQ</FigLabel>
              <h2 id="pricing-faq-heading" className="text-2xl font-bold tracking-[-0.04em]">
                Pricing questions
              </h2>
              <p className="mt-2 text-muted-foreground">
                How studio packages, milestones, and payments work.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4">
              {PRICING_FAQ.map((item, i) => (
                <ZigReveal key={item.question} index={i}>
                  <EngineeredPanel className="p-6">
                    <h3 className="text-sm font-semibold">{item.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </EngineeredPanel>
                </ZigReveal>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
