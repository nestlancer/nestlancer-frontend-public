import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { landingUrl } from '@nestlancer/constants';
import { NestlancerBrandLink } from '@nestlancer/ui';

import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { RedirectIfAuthenticated } from '@/components/auth/RedirectIfAuthenticated';
import { AuthThemeToggle } from './AuthThemeToggle';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RedirectIfAuthenticated>
      <div className="public-editorial relative z-[1] min-h-dvh bg-background p-6 text-foreground sm:p-0">
        <div className="relative flex min-h-dvh w-full flex-col justify-center lg:flex-row">
          <div className="flex flex-1 flex-col lg:w-1/2 lg:min-h-dvh">
            <header className="flex w-full shrink-0 items-center justify-between gap-4 px-0 pb-2 pt-0 sm:px-2 sm:pb-4 lg:px-8 lg:pb-0 lg:pt-8 xl:px-12">
              <NestlancerBrandLink
                href={landingUrl('/')}
                variant="icon"
                size="md"
                className="sm:hidden"
              />
              <NestlancerBrandLink
                href={landingUrl('/')}
                variant="full"
                size="md"
                className="hidden sm:inline-flex"
              />
              <AuthThemeToggle />
            </header>

            <main
              id="main-content"
              className="flex flex-1 flex-col justify-start px-0 pb-6 sm:px-2 lg:justify-center lg:px-8 lg:pb-12 xl:px-12"
            >
              <div className="mx-auto w-full max-w-md">{children}</div>
            </main>

            <footer className="px-0 pb-6 pt-0 text-center text-xs text-muted-foreground sm:px-2 lg:px-8 xl:px-12">
              <Link href="/terms" className="font-medium text-primary hover:opacity-90">
                Terms
              </Link>
              <span aria-hidden="true"> · </span>
              <Link href="/privacy" className="font-medium text-primary hover:opacity-90">
                Privacy
              </Link>
            </footer>
          </div>

          <AuthBrandPanel />
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
