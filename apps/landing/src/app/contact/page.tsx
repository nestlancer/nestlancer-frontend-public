import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';

import { Button, Container, EngineeredPanel, FigLabel } from '@nestlancer/ui';

import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { Reveal, ZigReveal } from '../../components/motion/MotionPrimitives';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT_FAQ } from '../../lib/faq';
import { STUDIO_OFFERS } from '../../lib/studio-offers';
import { webAppUrl } from '../../lib/web-app-url';
import { buildPageMetadata, faqPageJsonLd } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact',
  description: 'Contact the Nestlancer studio for project inquiries, support, and partnerships.',
  path: '/contact',
});

type PageProps = {
  searchParams?: { service?: string };
};

const BRIEF_ITEMS = [
  'What you want to ship (web, mobile, store, or something else)',
  'Rough timeline and any hard launch date',
  'Budget band, even a range',
  'Links to references, a brief, or an existing product',
] as const;

export default async function ContactPage({ searchParams }: PageProps) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const service = searchParams?.service?.trim();
  const selected = service
    ? STUDIO_OFFERS.find((offer) => offer.slug === service || offer.name === service)
    : undefined;
  const contactPath = service ? `/contact?service=${encodeURIComponent(service)}` : '/contact';
  const href = webAppUrl(contactPath);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd nonce={nonce} data={faqPageJsonLd(CONTACT_FAQ)} />
      <MarketingHeader />
      <main id="main-content">
        <section className="hero-orbs border-b border-border py-12 md:py-16">
          <Container className="relative z-10 mx-auto max-w-2xl">
            <Reveal>
              <FigLabel>FIG · Contact</FigLabel>
              <h1 className="text-4xl font-bold tracking-[-0.05em]">Contact the studio</h1>
              <p className="mt-4 text-muted-foreground">
                Sales, support, and partnership inquiries. Open the secure form on the Nestlancer
                app — we typically respond within one business day.
              </p>
            </Reveal>
          </Container>
        </section>
        <Container className="py-10 md:py-14">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <ZigReveal index={0}>
              <EngineeredPanel className="flex h-full min-w-0 flex-col p-6 sm:p-8">
                <h2 className="text-lg font-semibold tracking-tight">Open the secure form</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  The marketing site hands off to the app contact form so spam protection and
                  delivery stay in one place — no duplicate submissions.
                </p>
                {selected ? (
                  <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                    Preselected service:{' '}
                    <span className="font-medium text-foreground">
                      {selected.name} · {selected.price} · {selected.timeline}
                    </span>
                  </p>
                ) : service ? (
                  <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                    Preselected service:{' '}
                    <span className="font-medium text-foreground">{service}</span>
                  </p>
                ) : null}
                <Button asChild className="mt-6 w-full rounded-full sm:w-auto">
                  <Link href={href}>Open contact form →</Link>
                </Button>
                <div className="mt-8">
                  <h3 className="text-sm font-semibold">What to include</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {BRIEF_ITEMS.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="font-bold text-[hsl(var(--success))]" aria-hidden>
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex min-w-0 flex-wrap gap-2 overflow-x-clip">
                  {['Reply in 24h', 'Fixed-price', 'Made in India'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground"
                    >
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </EngineeredPanel>
            </ZigReveal>

            <div className="grid min-w-0 gap-4">
              <ZigReveal index={1}>
                <EngineeredPanel className="min-w-0 p-6">
                  <h2 className="text-sm font-semibold">Studio</h2>
                  <p className="mt-2 text-sm text-muted-foreground">contact@nestlancer.com</p>
                  <p className="mt-1 text-sm text-muted-foreground">Typical reply &lt; 24h · IST</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Prefer to browse first?{' '}
                    <Link href="/pricing" className="font-medium text-primary hover:underline">
                      See pricing
                    </Link>{' '}
                    or{' '}
                    <Link href="/services" className="font-medium text-primary hover:underline">
                      services
                    </Link>
                    .
                  </p>
                </EngineeredPanel>
              </ZigReveal>
              {CONTACT_FAQ.map((item, i) => (
                <ZigReveal key={item.question} index={i + 2}>
                  <EngineeredPanel className="min-w-0 p-6">
                    <h3 className="text-sm font-semibold">{item.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </EngineeredPanel>
                </ZigReveal>
              ))}
            </div>
          </div>
        </Container>
      </main>
      <MarketingFooter />
    </div>
  );
}
