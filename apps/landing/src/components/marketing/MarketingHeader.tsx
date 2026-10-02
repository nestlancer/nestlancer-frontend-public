'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  Button,
  Container,
  NestlancerBrandLink,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@nestlancer/ui';
import { Menu } from '@nestlancer/ui/icons';

import { webAppUrl } from '../../lib/web-app-url';
import { ThemeToggle } from '../theme-toggle';

const navLinkClass =
  'transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm';

const mobileNavLinkClass =
  'block rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'Product', external: false },
  { href: webAppUrl('/portfolio'), label: 'Portfolio', external: true },
  { href: webAppUrl('/blog'), label: 'Blog', external: true },
  { href: '/about', label: 'About', external: false },
  { href: '/pricing', label: 'Pricing', external: false },
  { href: '/services', label: 'Services', external: false },
  { href: '/contact', label: 'Contact', external: false },
] as const;

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-elevation-3">
      <Container className="flex h-14 items-center justify-between md:h-16">
        <div className="flex items-center gap-8">
          <NestlancerBrandLink href="/" variant="full" size="lg" />
          <nav
            className="hidden gap-5 text-sm font-medium text-muted-foreground lg:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a key={link.label} href={link.href} className={navLinkClass}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={navLinkClass}>
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href={webAppUrl('/login')} prefetch={false}>
                Sign in
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full px-4 shadow-[0_0_28px_hsl(var(--primary)/0.25)]"
            >
              <Link href={webAppUrl('/register')} prefetch={false}>
                Start a project
              </Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full px-2 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </Container>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          id="landing-mobile-nav"
          side="right"
          className="w-full border-border bg-background p-0 sm:w-[min(100%,20rem)]"
        >
          <div className="border-b border-border px-5 pb-5 pt-8">
            <SheetHeader className="pr-10">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Navigate Nestlancer</SheetDescription>
            </SheetHeader>
          </div>
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile primary">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  className={mobileNavLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={mobileNavLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={webAppUrl('/login')} prefetch={false} onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button asChild className="w-full rounded-full">
              <Link
                href={webAppUrl('/register')}
                prefetch={false}
                onClick={() => setMenuOpen(false)}
              >
                Start a project
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
