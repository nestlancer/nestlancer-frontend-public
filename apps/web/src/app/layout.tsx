import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Mono, Instrument_Sans, Outfit } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { BRAND, BRAND_KEYWORDS } from '@nestlancer/constants';
import {
  FaviconManager,
  CookieConsentBanner,
  faviconInitScript,
  themeInitScript,
} from '@nestlancer/ui';

import { AppProviders } from '@/components/providers/AppProviders';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { JsonLd } from '@/components/seo/JsonLd';
import { loadInitialMaintenanceStatus } from '@/lib/load-maintenance-status';
import { absoluteUrl, getSiteOrigin, organizationJsonLd, websiteJsonLd } from '@/lib/seo';

import './globals.css';

/** Dashboard display (unchanged). Public surfaces prefer Instrument via --font-public-sans. */
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const publicSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

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
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: siteOrigin,
  },
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialMaintenance = await loadInitialMaintenanceStatus();
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Favicon is injected purely via JS to prevent React hydration conflicts when bypassing Chrome cache */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: faviconInitScript }} />
        <JsonLd nonce={nonce} data={[organizationJsonLd(), websiteJsonLd()]} />
      </head>
      <body
        className={`${display.variable} ${sans.variable} ${publicSans.variable} ${mono.variable} font-sans`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <ThemeProvider defaultTheme="system">
          <FaviconManager />
          <CookieConsentBanner
            privacyHref="/privacy"
            cookieDomain={process.env.NODE_ENV === 'production' ? '.nestlancer.com' : undefined}
          />
          <AppProviders initialMaintenance={initialMaintenance}>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
