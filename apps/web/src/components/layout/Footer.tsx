import Link from 'next/link';

import { Container, NestlancerBrandLink } from '@nestlancer/ui';
import { landingUrl, routes } from '@nestlancer/constants';

const productLinks = [
  { href: landingUrl('/pricing'), label: 'Pricing', external: true },
  { href: landingUrl('/services'), label: 'Services', external: true },
  { href: routes.portfolio, label: 'Portfolio', external: false },
  { href: routes.blog, label: 'Blog', external: false },
] as const;

const companyLinks = [
  { href: landingUrl('/about'), label: 'About', external: true },
  { href: '/contact', label: 'Contact', external: false },
  { href: routes.register, label: 'Start a project', external: false },
] as const;

const legalLinks = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/verify-document', label: 'Verify document' },
] as const;

function ColLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const className = 'text-sm text-muted-foreground transition-colors hover:text-foreground';
  if (external) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="grid grid-cols-2 gap-6 py-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-10 md:py-14">
        <div className="col-span-2 md:col-span-1">
          <NestlancerBrandLink href={landingUrl('/')} variant="full" size="md" />
          <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground md:max-w-[36ch]">
            Product studio + client portal. Fixed-price quotes, Razorpay milestones, live Project
            Hub.
          </p>
        </div>
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Product
          </p>
          <ul className="space-y-2">
            {productLinks.map((l) => (
              <li key={l.href}>
                <ColLink {...l} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Company
          </p>
          <ul className="space-y-2">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <ColLink {...l} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Legal
          </p>
          <ul className="space-y-2">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <ColLink href={l.href} label={l.label} />
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-full border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nestlancer. Made in India. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
