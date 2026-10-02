import { BRAND_PROCESS_STEPS } from '@nestlancer/constants';
import type { HomepageData } from './load-homepage-data';

/** Product capability — not fetched from an API. */
export const MILESTONE_PAY_STAT = { value: 'Milestones', label: 'Scheduled payments' } as const;

export function buildPlatformStats(data: HomepageData) {
  const featured = data.featuredItems.length;
  const categories = data.categories.length;
  const articles = data.blogPosts.length;
  return [
    { value: featured > 0 ? String(featured) : '—', label: 'Featured projects' },
    { value: categories > 0 ? String(categories) : '—', label: 'Service categories' },
    { value: articles > 0 ? String(articles) : '—', label: 'Latest articles' },
    MILESTONE_PAY_STAT,
  ] as const;
}

/** Decorative trust strip — industry verticals we serve, not third-party payment brands */
export const TRUST_LOGOS = [
  'HealthTech',
  'Fintech',
  'E-commerce',
  'SaaS',
  'B2B portals',
  'Mobile apps',
] as const;

export const PROCESS_STEPS = BRAND_PROCESS_STEPS;

export function buildGlobalStats(data: HomepageData) {
  const featured = data.featuredItems.length;
  const categories = data.categories.length;
  return [
    { value: categories > 0 ? String(categories) : '—', label: 'Portfolio categories' },
    { value: featured > 0 ? String(featured) : '—', label: 'Showcase projects' },
    {
      value: data.blogPosts.length > 0 ? String(data.blogPosts.length) : '—',
      label: 'Recent insights',
    },
  ] as const;
}

export const FALLBACK_CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'UI/UX Design',
  'E-commerce',
  'Branding',
  'Consulting',
] as const;
