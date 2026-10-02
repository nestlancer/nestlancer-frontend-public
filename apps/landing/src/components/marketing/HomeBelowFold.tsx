import Link from 'next/link';
import { Suspense } from 'react';

import {
  Button,
  Container,
  EngineeredPanel,
  FigLabel,
  MeshBackground,
  ProductStage,
} from '@nestlancer/ui';

import { FeaturedWorkSection } from './FeaturedWorkSection';
import { FeaturedWorkSlider } from './FeaturedWorkSlider';
import { MarketingFooter } from './MarketingFooter';
import { Reveal, Stagger, StaggerItem } from '../motion/MotionPrimitives';
import { webAppUrl } from '../../lib/web-app-url';

const TOUR_STEPS = [
  {
    n: '02.1 Request',
    title: 'Scoped intake, not a ticket black hole',
    body: 'Category, budget band, timeline, and files — structured so quotes aren’t written from Slack archaeology.',
  },
  {
    n: '02.2 Quote',
    title: 'Fixed-price line items with milestones',
    body: 'Transparent breakdown. Accept locks scope. Revisions stay attached to the milestone that owns them.',
  },
  {
    n: '02.3 Build',
    title: 'Live progress, files, and messages',
    body: 'Stakeholders see status without chasing updates. Studio ships; clients approve in context.',
  },
  {
    n: '02.4 Pay & release',
    title: 'Milestone pay with Razorpay / UPI',
    body: 'Deposit → milestone → final. Invoice PDFs at every payment gate.',
  },
] as const;

const BRANDS = [
  'HealthTech',
  'Fintech',
  'E-commerce',
  'SaaS',
  'B2B portals',
  'Mobile apps',
  'Design systems',
  'Marketplaces',
] as const;

/**
 * Below-fold marketing body (FIG 02–06 + footer).
 * Async so the home shell can stream the hero before this tree renders.
 */
export async function HomeBelowFold() {
  return (
    <>
      {/* Trust marquee */}
      <section className="border-y border-border bg-[hsl(var(--surface-muted))] py-5" aria-hidden>
        <div className="trust-marquee">
          <div className="trust-marquee__track px-4">
            {[...BRANDS, ...BRANDS].map((name, i) => (
              <span key={`${name}-${i}`}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Product tour */}
      <section id="how-it-works" className="section-py">
        <Container>
          <Reveal className="mb-8 max-w-xl">
            <FigLabel>FIG 02 · Delivery narrative</FigLabel>
            <h2 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              From brief to release — one continuous surface.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every marketing claim is a real Project Hub state your client can open.
            </p>
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <Stagger className="grid gap-3">
              {TOUR_STEPS.map((step, i) => (
                <StaggerItem key={step.n}>
                  <EngineeredPanel
                    className={`p-4 ${i === 0 ? 'border-primary/35 bg-[hsl(var(--primary-dim))]' : ''}`}
                  >
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary">
                      {step.n}
                    </p>
                    <h3 className="mt-1 text-base font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </EngineeredPanel>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.15}>
              <ProductStage
                title="milestone timeline · NL-204"
                className="sticky top-24 self-start"
              >
                <div className="relative space-y-5 p-6 pl-10 before:absolute before:bottom-6 before:left-[1.35rem] before:top-6 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-border">
                  {[
                    { t: 'Discovery', d: 'Brief locked · deposit paid', done: true },
                    { t: 'UI Design', d: 'Approved · files in Hub', done: true },
                    { t: 'Frontend', d: '68% · in progress', done: false, active: true },
                    { t: 'QA & release', d: 'Pending final milestone', done: false },
                  ].map((m) => (
                    <div key={m.t} className="relative">
                      <span
                        className={`absolute -left-[1.65rem] top-1 size-3 rounded-full border-2 border-background ${
                          m.done
                            ? 'bg-[hsl(var(--success))]'
                            : m.active
                              ? 'bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]'
                              : 'bg-border'
                        }`}
                      />
                      <p
                        className={`text-sm font-semibold ${m.done ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {m.t}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.d}</p>
                    </div>
                  ))}
                </div>
              </ProductStage>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Payments mesh island */}
      <MeshBackground variant="island" id="payments">
        <Container>
          <Reveal className="mb-8 max-w-xl">
            <FigLabel className="!border-[#c9d4e0] !text-[#64748b] before:!bg-[#0d9488]">
              FIG 03 · Money surface
            </FigLabel>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-[#0a2540] sm:text-4xl">
              Financial clarity for every milestone.
            </h2>
            <p className="mt-3 text-[#425466]">
              Milestone gates, tabular ₹, and India rails — finance your team can audit.
            </p>
          </Reveal>
          <Stagger className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" stagger={0.1}>
            <StaggerItem>
              <div className="overflow-hidden rounded-2xl border border-[#e6ebf1] bg-white shadow-[0_24px_60px_rgba(10,37,64,0.1)]">
                <div className="flex items-center justify-between border-b border-[#e6ebf1] px-4 py-3 text-sm text-[#0a2540]">
                  <strong>Payments overview</strong>
                  <span className="text-[0.7rem] font-medium uppercase tracking-wider text-[#64748b]">
                    Preview · illustrative
                  </span>
                </div>
                <div className="px-4 pt-4 text-4xl font-bold tracking-tight text-[#0a2540] tabular-nums">
                  ₹4,28,500 <span className="text-sm font-medium text-[#64748b]">collected</span>
                </div>
                <div className="mx-4 mb-4 mt-3 h-20 rounded-lg bg-[repeating-linear-gradient(90deg,transparent,transparent_28px,rgba(10,37,64,0.05)_28px,rgba(10,37,64,0.05)_29px)]" />
                {[
                  ['Milestone 2 — Design', 'Paid', '₹29,500'],
                  ['Milestone 3 — Frontend', 'Pending', '₹48,000'],
                  ['Final payment', 'Due', '₹62,000'],
                ].map(([label, status, amt]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-[#e6ebf1] px-4 py-3 text-sm text-[#0a2540]"
                  >
                    <span>{label}</span>
                    <span
                      className={`text-xs font-semibold ${
                        status === 'Paid'
                          ? 'text-[#0f766e]'
                          : status === 'Pending'
                            ? 'text-[#b45309]'
                            : 'text-[#64748b]'
                      }`}
                    >
                      {status}
                    </span>
                    <span className="font-mono tabular-nums">{amt}</span>
                  </div>
                ))}
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-2xl border border-[#e6ebf1] bg-white p-5 shadow-[0_16px_40px_rgba(10,37,64,0.08)]">
                <p className="text-base font-semibold text-[#0a2540]">Checkout rails</p>
                <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-wider text-[#64748b]">
                  Preview · not a live checkout
                </p>
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-[#e6ebf1] bg-[#f6f9fc] p-1">
                  <span className="rounded-lg bg-white py-2 text-center text-xs font-semibold text-[#0a2540] shadow-sm">
                    Pay online
                  </span>
                  <span className="rounded-lg py-2 text-center text-xs font-semibold text-[#425466]">
                    Bank · UPI
                  </span>
                </div>
                <div
                  className="mt-4 w-full rounded-full bg-[#0d9488] px-4 py-2.5 text-center text-sm font-semibold text-white"
                  aria-hidden="true"
                >
                  Pay ₹48,000 now
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Razorpay', 'PCI', 'India rails', 'Refunds'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[#e6ebf1] bg-[#fafbfc] px-2.5 py-1 text-[0.7rem] font-semibold text-[#425466]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </StaggerItem>
          </Stagger>
        </Container>
      </MeshBackground>

      {/* Why bento */}
      <section id="why" className="section-py">
        <Container>
          <Reveal className="mb-8 max-w-xl">
            <FigLabel>FIG 04 · Why Nestlancer</FigLabel>
            <h2 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Engineered for delivery, not marketplace noise.
            </h2>
          </Reveal>
          <Stagger className="grid gap-3 md:grid-cols-12 md:grid-rows-2">
            <StaggerItem className="md:col-span-7 md:row-span-2">
              <EngineeredPanel
                lift
                className="flex h-full min-h-[220px] flex-col justify-between bg-[radial-gradient(circle_at_90%_10%,hsl(var(--primary)/0.15),transparent_45%)] p-6"
              >
                <div>
                  <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                    Preview · illustrative
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">Milestone payouts</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Razorpay milestones — deposit, mid, final.
                  </p>
                </div>
                <p className="text-5xl font-bold tracking-tight text-primary tabular-nums">₹4.2L</p>
              </EngineeredPanel>
            </StaggerItem>
            {[
              ['Reply under 2m', 'Typical studio response on active threads.', 'md:col-span-5'],
              ['Fixed-price only', 'No hourly fog. Scope locks on accept.', 'md:col-span-5'],
              ['Command density', 'Search jumps across Hub, quotes, pay.', 'md:col-span-4'],
              ['Deliverable gates', 'Payment gates tied to approvals.', 'md:col-span-4'],
              ['Selective intake', 'Quality over volume — scoped studio work.', 'md:col-span-4'],
            ].map(([t, d, span]) => (
              <StaggerItem key={t} className={span}>
                <EngineeredPanel lift className="h-full p-5">
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </EngineeredPanel>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* Work preview */}
      <section className="section-py border-t border-border">
        <Container>
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <FigLabel>FIG 05 · Selected work</FigLabel>
              <h2 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                Work that speaks for itself.
              </h2>
            </div>
            <Button variant="ghost" asChild className="rounded-full">
              <Link href={webAppUrl('/portfolio')}>View all →</Link>
            </Button>
          </Reveal>
          <Suspense fallback={<FeaturedWorkSlider items={[]} />}>
            <FeaturedWorkSection />
          </Suspense>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="border-y border-border bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.14),transparent_60%)] py-20 text-center">
        <Container>
          <Reveal>
            <FigLabel>FIG 06 · Start</FigLabel>
            <h2 className="mx-auto max-w-[16ch] text-3xl font-bold tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Ready to ship with clarity?
            </h2>
            <p className="mx-auto mt-3 max-w-[42ch] text-muted-foreground">
              Fixed-price studio work. Live Project Hub. Razorpay milestones. Intake is open.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>✓ Reply in 24h</span>
              <span>✓ Fixed-price quotes</span>
              <span>✓ No subscription</span>
              <span>✓ Made in India</span>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full px-6 shadow-[0_0_28px_hsl(var(--primary)/0.25)] transition-transform hover:-translate-y-0.5"
              >
                <Link href={webAppUrl('/register')}>Start a project →</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full transition-transform hover:-translate-y-0.5"
              >
                <Link href={webAppUrl('/login')}>Preview the portal</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <MarketingFooter />
    </>
  );
}
