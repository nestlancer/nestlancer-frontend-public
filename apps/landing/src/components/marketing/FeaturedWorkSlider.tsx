import Link from 'next/link';

import { safeNavigationUrl } from '@nestlancer/utils';

import type { FeaturedWorkCard } from '@/lib/load-featured-work';
import { webAppUrl } from '@/lib/web-app-url';

type FeaturedWorkSliderProps = {
  items: FeaturedWorkCard[];
};

function WorkCard({
  item,
  lazy,
  inertLink,
}: {
  item: FeaturedWorkCard;
  lazy: boolean;
  inertLink?: boolean;
}) {
  return (
    <Link
      href={webAppUrl(`/portfolio/${item.slug}`)}
      className="engineered-panel engineered-panel-lift group block w-[min(78vw,18.5rem)] shrink-0 overflow-hidden sm:w-[20rem]"
      tabIndex={inertLink ? -1 : undefined}
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${item.gradient} to-[#111]`}
      >
        {safeNavigationUrl(item.imageUrl) ? (
          // Native img: landing has no next/image remote host allowlist for media CDN.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeNavigationUrl(item.imageUrl) ?? undefined}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
          />
        ) : null}
        <span className="absolute bottom-3 left-3 rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-white backdrop-blur">
          {item.tag}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold tracking-tight group-hover:text-primary">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.subtitle}</p>
      </div>
    </Link>
  );
}

/** Infinite left-to-right slider of real portfolio case studies. */
export function FeaturedWorkSlider({ items }: FeaturedWorkSliderProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Case studies live in the portfolio as they are published.
      </p>
    );
  }

  return (
    <div className="work-marquee" role="region" aria-label="Selected studio work">
      <div className="work-marquee__track">
        <div className="work-marquee__group">
          {items.map((item, index) => (
            <WorkCard key={`${item.slug}-a`} item={item} lazy={index > 0} />
          ))}
        </div>
        <div className="work-marquee__group" aria-hidden="true" inert>
          {items.map((item) => (
            <WorkCard key={`${item.slug}-b`} item={item} lazy inertLink />
          ))}
        </div>
      </div>
    </div>
  );
}
