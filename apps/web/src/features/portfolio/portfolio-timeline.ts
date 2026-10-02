import { routes } from '@nestlancer/constants';
import type { PortfolioTimelineItem, PublicPortfolioItem } from '@nestlancer/types';
import type { PortfolioTimelineEntry } from '@nestlancer/ui';
import {
  comparePortfolioByDateDesc,
  formatPortfolioProjectDate,
  formatPortfolioProjectYear,
} from '@nestlancer/utils';

type TimelineSource = PublicPortfolioItem | PortfolioTimelineItem;

function isPublicItem(item: TimelineSource): item is PublicPortfolioItem {
  return 'shortDescription' in item || 'thumbnailUrl' in item || 'category' in item;
}

export function toTimelineEntries(items: TimelineSource[]): PortfolioTimelineEntry[] {
  return [...items].sort(comparePortfolioByDateDesc).map((item) => {
    const publicItem = isPublicItem(item) ? item : null;
    return {
      id: item.id,
      title: item.title,
      dateLabel: formatPortfolioProjectDate(item),
      href: routes.portfolioItem(item.slug || item.id),
      year: formatPortfolioProjectYear(item),
      thumbnailUrl: publicItem?.thumbnailUrl ?? null,
      category: publicItem?.category?.name ?? null,
      summary: publicItem?.shortDescription ?? null,
      featured: publicItem?.featured ?? false,
      technologies: publicItem?.projectDetails?.technologies ?? [],
    };
  });
}
