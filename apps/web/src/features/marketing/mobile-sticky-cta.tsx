'use client';

import Link from 'next/link';

import { useAuth } from '@nestlancer/auth';
import { routes } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

/** Thumb-zone primary CTA for mobile — dashboard when signed in, register otherwise. */
export function MobileStickyCta() {
  const { isAuthenticated } = useAuth();
  const href = isAuthenticated ? routes.dashboard : routes.register;
  const label = isAuthenticated ? 'Go to dashboard' : 'Post a request';

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/90 p-3 backdrop-blur-md md:hidden">
      <Button asChild size="lg" className="h-12 w-full text-base shadow-sm">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
