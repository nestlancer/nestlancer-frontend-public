import Link from 'next/link';

import { Container, NestlancerBrandLink } from '@nestlancer/ui';

import { webAppUrl } from '../../lib/web-app-url';

const productLinks = [
  { href: '/#how-it-works', label: 'Project Hub' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/services', label: 'Services' },
  { href: webAppUrl('/portfolio'), label: 'Portfolio' },
] as const;

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: webAppUrl('/blog'), label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: webAppUrl('/register'), label: 'Start a project' },
] as const;

const legalLinks = [
  { href: webAppUrl('/terms'), label: 'Terms' },
  { href: webAppUrl('/privacy'), label: 'Privacy' },
  { href: webAppUrl('/verify-document'), label: 'Verify document' },
] as const;

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <Container className="grid grid-cols-2 gap-6 py-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-10 md:py-14">
        <div className="col-span-2 md:col-span-1">
          <NestlancerBrandLink href="/" variant="full" size="lg" />
          <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground md:max-w-[36ch]">
            Product studio + client portal. Fixed-price quotes, Razorpay milestones, live Project
            Hub.
          </p>
        </div>
        <FooterCol title="Product" links={productLinks} />
        <FooterCol title="Company" links={companyLinks} />
        <FooterCol title="Legal" links={legalLinks} />
        <div className="col-span-full border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nestlancer. Made in India. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
