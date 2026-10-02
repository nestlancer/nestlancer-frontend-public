'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Container, EngineeredPanel, FigLabel } from '@nestlancer/ui';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';

import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { MarketingHeader } from '../../components/marketing/MarketingHeader';
import { Reveal, ZigReveal } from '../../components/motion/MotionPrimitives';
import { offerBySlugOrName, STUDIO_OFFERS } from '../../lib/studio-offers';
import { webAppUrl } from '../../lib/web-app-url';

type ServiceCard = {
  slug: string;
  title: string;
  description: string;
  price: string;
  timeline: string;
  features: readonly string[];
};

const FALLBACK_SERVICES: ServiceCard[] = STUDIO_OFFERS.map((offer) => ({
  slug: offer.slug,
  title: offer.name,
  description: offer.description,
  price: offer.price,
  timeline: offer.timeline,
  features: offer.features,
}));

function apiBase(): string {
  if (typeof window !== 'undefined') return '';
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

function pickServices(raw: unknown): ServiceCard[] {
  if (!raw || typeof raw !== 'object') return [];
  const rec = raw as Record<string, unknown>;
  const data =
    rec.data && typeof rec.data === 'object' ? (rec.data as Record<string, unknown>) : rec;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data.services)
      ? data.services
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(rec.services)
          ? rec.services
          : [];

  return (list as Array<Record<string, unknown>>)
    .map((service) => {
      const slug = String(service.slug ?? service.id ?? '');
      const title = String(service.name ?? service.title ?? 'Service');
      const catalog = offerBySlugOrName(slug, title);
      const features = Array.isArray(service.features)
        ? service.features.map((item) => String(item)).filter(Boolean)
        : catalog?.features;
      return {
        slug,
        title,
        description: String(
          service.shortDescription ?? service.description ?? catalog?.description ?? ''
        ),
        price: String(service.price ?? service.startingPrice ?? catalog?.price ?? 'Custom quote'),
        timeline: String(
          service.timeline ?? service.duration ?? catalog?.timeline ?? 'Scoped per brief'
        ),
        features: features && features.length > 0 ? features : (catalog?.features ?? []),
      };
    })
    .filter((s) => s.title);
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = new Headers({ Accept: 'application/json' });
        applyCorrelationHeaders(headers, resolveCorrelationId({ headers }));
        const res = await fetch(`${apiBase()}/api/v1/services`, {
          headers,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          const parsed = pickServices(json);
          setServices(parsed.length >= 2 ? parsed : FALLBACK_SERVICES);
        }
      } catch {
        if (!cancelled) setServices(FALLBACK_SERVICES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main id="main-content">
        <section className="hero-orbs border-b border-border py-14 md:py-20">
          <Container className="relative z-10 mx-auto max-w-2xl text-center">
            <Reveal>
              <FigLabel>FIG · Services</FigLabel>
              <h1 className="text-4xl font-bold tracking-[-0.05em]">Services</h1>
              <p className="mt-4 text-muted-foreground">
                The same studio packages as Pricing — price, duration, and deliverables included.
              </p>
            </Reveal>
          </Container>
        </section>

        <Container className="py-14">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl border border-border bg-surface-muted/60"
                />
              ))}
            </div>
          ) : (
            <div className="grid min-w-0 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <ZigReveal key={service.slug || service.title} index={i}>
                  <EngineeredPanel
                    as="article"
                    lift
                    accent
                    className="flex h-full min-w-0 flex-col p-6"
                  >
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {service.title}
                    </h2>
                    {service.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                    ) : null}
                    <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">
                      {service.price}
                    </p>
                    <p className="text-xs text-muted-foreground">{service.timeline}</p>
                    {service.features.length > 0 ? (
                      <ul className="mb-6 mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <span className="font-bold text-[hsl(var(--success))]" aria-hidden>
                              ✓
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div className="mt-4 text-sm">
                      {service.slug ? (
                        <Link
                          href={webAppUrl(`/contact?service=${encodeURIComponent(service.slug)}`)}
                          className="font-medium text-primary hover:underline"
                        >
                          Request this service →
                        </Link>
                      ) : (
                        <Link
                          href={webAppUrl('/contact')}
                          className="font-medium text-primary hover:underline"
                        >
                          Contact us →
                        </Link>
                      )}
                    </div>
                  </EngineeredPanel>
                </ZigReveal>
              ))}
            </div>
          )}
        </Container>
      </main>
      <MarketingFooter />
    </div>
  );
}
