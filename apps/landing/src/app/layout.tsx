import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { BRAND, BRAND_KEYWORDS } from '@nestlancer/constants';
import {
  FaviconManager,
  CookieConsentBanner,
  faviconInitScript,
  themeInitScript,
} from '@nestlancer/ui';

import { ThemeProvider } from '@/components/theme-provider';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, getSiteOrigin, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { webAppUrl } from '@/lib/web-app-url';

import './globals.css';

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});
const display = sans;

const siteOrigin = getSiteOrigin();

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.longDescription,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name, url: siteOrigin }],
  creator: BRAND.name,
  publisher: BRAND.name,
  keywords: [...BRAND_KEYWORDS],
  category: 'technology',
  icons: {
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  manifest: '/manifest.webmanifest',
  alternates: { canonical: siteOrigin },
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    url: siteOrigin,
    siteName: BRAND.name,
    locale: BRAND.locale,
    images: [{ url: absoluteUrl(BRAND.ogImagePath), width: 1200, height: 630, alt: BRAND.name }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.shortDescription,
    images: [absoluteUrl(BRAND.twitterImagePath)],
  },
  robots: {
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
};

export default async function LandingLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: faviconInitScript }} />
        <JsonLd nonce={nonce} data={[organizationJsonLd(), websiteJsonLd()]} />
      </head>
      <body className={`${sans.variable} ${mono.variable} ${display.variable} font-sans`}>
        <ThemeProvider defaultTheme="system">
          <FaviconManager />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          <CookieConsentBanner
            privacyHref={webAppUrl('/privacy')}
            cookieDomain={process.env.NODE_ENV === 'production' ? '.nestlancer.com' : undefined}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
