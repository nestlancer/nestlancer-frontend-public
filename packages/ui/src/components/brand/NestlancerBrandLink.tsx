import { cn } from '../../utils/cn';
import { NestlancerLogo, type NestlancerLogoProps } from './NestlancerLogo';

export type NestlancerBrandLinkProps = NestlancerLogoProps & {
  href: string;
};

/**
 * Linked brand mark — single entry for public/marketing chrome that needs a home href.
 * Uses a plain anchor so @nestlancer/ui stays free of next/link.
 */
export function NestlancerBrandLink({
  href,
  className,
  variant,
  size = 'md',
  theme = 'auto',
}: NestlancerBrandLinkProps) {
  return (
    <a
      href={href}
      aria-label="Nestlancer home"
      className={cn('inline-flex items-center transition-opacity hover:opacity-80', className)}
    >
      <NestlancerLogo variant={variant} size={size} theme={theme} />
    </a>
  );
}
