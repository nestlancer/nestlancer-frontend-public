import type { Metadata } from 'next';
import Link from 'next/link';

import { BRAND } from '@nestlancer/constants';
import { Button, Container, EngineeredPanel, FigLabel } from '@nestlancer/ui';

import { AboutPhotoHero } from '../../components/marketing/AboutPhotoHero';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { Reveal, SoftTilt, ZigReveal } from '../../components/motion/MotionPrimitives';
import { webAppUrl } from '../../lib/web-app-url';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'About',
  description: `Learn about ${BRAND.name} — a dedicated product studio for clients, from brief to delivery.`,
  path: '/about',
});

const CAPABILITIES = [
  { value: 'Web & apps', label: 'Full-stack product delivery' },
  { value: 'Design', label: 'UI/UX and brand systems' },
  { value: 'One studio', label: 'Direct operator collaboration' },
] as const;

const WORKFLOW = [
  {
    title: 'Request',
    description: 'Share goals, scope, and timeline through the client portal.',
  },
  {
    title: 'Quote',
    description: 'Receive a line-item proposal with a clear payment schedule.',
  },
  {
    title: 'Build & pay',
    description: 'Pay milestones via Razorpay, approve deliverables, and track progress.',
  },
] as const;

const VALUES = [
  {
    title: 'Transparency first',
    description: 'Clear quotes, visible milestones, and no surprise fees.',
  },
  {
    title: 'Quality over volume',
    description: "We'd rather deliver fewer projects exceptionally well.",
  },
  {
    title: 'Human by design',
    description: 'Technology should connect people, not replace the craft.',
  },
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main id="main-content">
        <SoftTilt>
          <AboutPhotoHero />
        </SoftTilt>

        <section className="py-20">
          <Container>
            <Reveal className="mx-auto max-w-2xl">
              <FigLabel>FIG · Studio</FigLabel>
              <h2 className="text-3xl font-bold tracking-[-0.04em]">About Nestlancer</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Nestlancer is a dedicated product studio. Clients work with one operator through a
                single workflow: request, quote, milestone payment, delivery. We believe great work
                happens when process gets out of the way.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {CAPABILITIES.map((stat, i) => (
                <ZigReveal key={stat.label} index={i}>
                  <EngineeredPanel lift className="h-full p-6 text-center sm:text-left">
                    <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </EngineeredPanel>
                </ZigReveal>
              ))}
            </div>

            <div className="mt-20">
              <Reveal>
                <FigLabel>FIG · Workflow</FigLabel>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">
                  From brief to handoff
                </h2>
              </Reveal>
              <div className="mt-8 grid gap-0 overflow-hidden rounded-2xl border border-border sm:grid-cols-3">
                {WORKFLOW.map((step, i) => (
                  <ZigReveal key={step.title} index={i}>
                    <div
                      className={`h-full bg-surface p-6 ${i < WORKFLOW.length - 1 ? 'border-b border-border sm:border-b-0 sm:border-r' : ''}`}
                    >
                      <p className="font-mono text-xs text-primary">0{i + 1}</p>
                      <p className="mt-2 font-semibold">{step.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </ZigReveal>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-border py-16">
          <Container>
            <Reveal>
              <FigLabel className="mx-auto flex w-fit">FIG · Values</FigLabel>
              <h2 className="text-center text-2xl font-bold tracking-[-0.03em]">What we believe</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {VALUES.map((value, i) => (
                <ZigReveal key={value.title} index={i}>
                  <EngineeredPanel lift accent className="h-full p-6 text-center">
                    <h3 className="font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {value.description}
                    </p>
                  </EngineeredPanel>
                </ZigReveal>
              ))}
            </div>
            <Reveal className="mt-12 text-center" delay={0.1}>
              <Button asChild className="rounded-full">
                <Link href={webAppUrl('/register')}>Start a project →</Link>
              </Button>
            </Reveal>
          </Container>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
