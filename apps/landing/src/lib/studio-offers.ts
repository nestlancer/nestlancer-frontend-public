import { getSiteOrigin } from './site-origin';

const webAppBase = getSiteOrigin();

export type StudioOffer = {
  slug: string;
  name: string;
  price: string;
  timeline: string;
  description: string;
  features: readonly string[];
  highlighted: boolean;
  cta: string;
  href: string;
};

export const STUDIO_OFFERS: readonly StudioOffer[] = [
  {
    slug: 'web-application-mvp',
    name: 'Web Application MVP',
    price: '₹59,000',
    timeline: '≈ 30 days',
    description:
      'End-to-end MVP delivery: discovery, design, frontend and backend, QA, and production handoff.',
    features: [
      'Discovery & requirements workshop',
      'UI/UX for core screens',
      'Frontend + backend API',
      'QA, deployment & handoff',
      '2 revision rounds included',
    ],
    highlighted: true,
    cta: 'Start this package',
    href: `${webAppBase}/register`,
  },
  {
    slug: 'custom-project',
    name: 'Custom project',
    price: 'Custom quote',
    timeline: 'Scoped per brief',
    description:
      'Mobile apps, e-commerce, design systems, and complex product builds — priced after your request.',
    features: [
      'Tailored scope & timeline',
      'Milestone payment schedule',
      'Dedicated studio delivery',
      'Progress tracking in-app',
      'Invoices & receipts',
    ],
    highlighted: false,
    cta: 'Request a quote',
    href: `${webAppBase}/register`,
  },
  {
    slug: 'studio-consult',
    name: 'Talk to the studio',
    price: 'Free consult',
    timeline: 'Reply in 1 business day',
    description:
      'Not sure which engagement fits? Share your goals and we will recommend a package or custom plan.',
    features: [
      'No subscription required',
      'Transparent line-item quotes',
      'Razorpay milestone payments',
      'Portfolio references',
    ],
    highlighted: false,
    cta: 'Contact us',
    href: '/contact',
  },
] as const;

export function offerBySlugOrName(slug: string, title?: string): StudioOffer | undefined {
  const slugKey = slug.trim().toLowerCase();
  const titleKey = title?.trim().toLowerCase() ?? '';
  return STUDIO_OFFERS.find(
    (offer) =>
      offer.slug === slugKey ||
      offer.name.toLowerCase() === titleKey ||
      offer.name.toLowerCase() === slugKey
  );
}
