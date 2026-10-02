'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { useAuth } from '@nestlancer/auth';
import { routes } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

type HomepagePrimaryCtaProps = {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline';
  children?: ReactNode;
  authenticatedLabel?: string;
  guestLabel?: string;
};

/** Primary homepage CTA — dashboard when signed in, register otherwise. */
export function HomepagePrimaryCta({
  className,
  size = 'lg',
  variant = 'default',
  children,
  authenticatedLabel = 'Go to dashboard',
  guestLabel = 'Post a request',
}: HomepagePrimaryCtaProps) {
  const { isAuthenticated } = useAuth();
  const href = isAuthenticated ? routes.dashboard : routes.register;
  const label = children ?? (isAuthenticated ? authenticatedLabel : guestLabel);

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
