import type { Metadata } from 'next';

import { BRAND, BRAND_KEYWORDS } from '@nestlancer/constants';

const DEFAULT_LANDING_ORIGIN = 'https://nestlancer.com';

export function getSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_LANDING_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? DEFAULT_LANDING_ORIGIN : undefined);
  if (raw) return raw.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? DEFAULT_LANDING_ORIGIN : 'http://localhost:9020';
}

export function absoluteUrl(path = '/'): string {
  const origin = getSiteOrigin();
  if (!path || path === '/') return origin;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

type PageSeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  keywords?: string[];
  /** When true, title is used as-is (no `%s · Nestlancer` template). */
  absoluteTitle?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noIndex = false,
  keywords,
  absoluteTitle = false,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image
    ? image.startsWith('http')
      ? image
      : absoluteUrl(image)
    : absoluteUrl(BRAND.ogImagePath);
  const kw = keywords?.length ? keywords : [...BRAND_KEYWORDS];

  return {
    title: absoluteTitle || path === '/' ? { absolute: title } : title,
    description,
    keywords: kw,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND.name,
      locale: BRAND.locale,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: BRAND.name,
    legalName: BRAND.legalName,
    description: BRAND.shortDescription,
    url: getSiteOrigin(),
    logo: absoluteUrl('/apple-touch-icon.png'),
    image: absoluteUrl(BRAND.ogImagePath),
    areaServed: [...BRAND.areaServed],
    priceRange: '₹₹',
    email: 'hello@nestlancer.com',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Nestlancer studio services',
      itemListElement: BRAND.offerCatalog.map((offer) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: offer.name,
          description: offer.description,
        },
      })),
    },
    ...(BRAND.sameAs.length ? { sameAs: [...BRAND.sameAs] } : {}),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: getSiteOrigin(),
    description: BRAND.shortDescription,
    publisher: { '@type': 'Organization', name: BRAND.name },
  };
}

export function faqPageJsonLd(faqs: readonly { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
