import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import {
  FaviconManager,
  CookieConsentBanner,
  faviconInitScript,
  themeInitScript,
} from '@nestlancer/ui';

import { AdminProviders } from '@/components/providers/AdminProviders';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Nestlancer Admin', template: '%s · Admin' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Favicon is injected purely via JS to prevent React hydration conflicts when bypassing Chrome cache */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: faviconInitScript }} />
      </head>
      <body className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="system">
          <FaviconManager />
          <CookieConsentBanner
            privacyHref="https://app.nestlancer.com/privacy"
            cookieDomain={process.env.NODE_ENV === 'production' ? '.nestlancer.com' : undefined}
          />
          <AdminProviders>{children}</AdminProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
