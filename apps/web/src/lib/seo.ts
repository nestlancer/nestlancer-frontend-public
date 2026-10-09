import type { Metadata } from 'next';

import { BRAND, BRAND_KEYWORDS } from '@nestlancer/constants';

import { absoluteUrl, getSiteOrigin } from '@/lib/site-origin';

export { absoluteUrl, getSiteOrigin } from '@/lib/site-origin';

/** Signed S3 URLs encode `&` as `&amp;` in HTML meta — scrapers that don't entity-decode break. */
function isPresignedOrQueryHeavyUrl(url: string): boolean {
  return /[?&]X-Amz-|Signature=|X-Goog-/i.test(url) || (url.includes('?') && url.includes('&'));
}

/** Prefer stable public assets for OG/Twitter cards; fall back to brand image for signed URLs. */
export function ogSafeImageUrl(image?: string | null): string {
  const brand = absoluteUrl(BRAND.ogImagePath);
  if (!image?.trim()) return brand;
  const resolved = image.startsWith('http') ? image : absoluteUrl(image);
  if (isPresignedOrQueryHeavyUrl(resolved)) return brand;
  return resolved;
}

type PageSeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
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
  publishedTime,
  modifiedTime,
  absoluteTitle = false,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = ogSafeImageUrl(image);
  const kw = keywords?.length ? keywords : [...BRAND_KEYWORDS];

  return {
    title: absoluteTitle || path === '/' ? { absolute: title } : title,
    description,
    keywords: kw,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
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
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
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
    email: 'contact@nestlancer.com',
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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getSiteOrigin()}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  authorName?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    ...(input.image
      ? {
          image: [input.image.startsWith('http') ? input.image : absoluteUrl(input.image)],
        }
      : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.modifiedAt
      ? { dateModified: input.modifiedAt }
      : { dateModified: input.publishedAt }),
    author: {
      '@type': 'Person',
      name: input.authorName || BRAND.name,
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/apple-touch-icon.png'),
      },
    },
  };
}

export function creativeWorkJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  keywords?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    ...(input.image
      ? { image: input.image.startsWith('http') ? input.image : absoluteUrl(input.image) }
      : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
    creator: { '@type': 'Organization', name: BRAND.name },
  };
}
