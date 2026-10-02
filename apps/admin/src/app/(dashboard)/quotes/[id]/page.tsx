import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { QuoteDetailClient } from '@/features/quotes/QuoteDetailClient';

/**
 * Static / probe segments that must not be treated as quote UUIDs.
 * Line-items and library are not standalone admin pages.
 */
const RESERVED_QUOTE_SEGMENTS = new Set([
  'drafts',
  'new',
  'templates',
  'stats',
  'payment-schedules',
  'line-items',
  'library',
]);

const QUOTE_HUB_REDIRECTS: Record<string, string> = {
  drafts: '/quotes/drafts',
  new: '/requests',
  // No standalone templates page — panel retired; hub list is the landing.
  templates: '/quotes',
  stats: '/quotes/stats',
  'payment-schedules': '/quotes',
};

/** Segments the master map treats as absent — hard 404, not a silent hub redirect. */
const QUOTE_ABSENT_SEGMENTS = new Set(['line-items', 'library']);

export const metadata: Metadata = { title: 'Quote detail' };

export default function AdminQuoteDetailPage({ params }: { params: { id: string } }) {
  if (QUOTE_ABSENT_SEGMENTS.has(params.id)) {
    notFound();
  }
  if (RESERVED_QUOTE_SEGMENTS.has(params.id)) {
    redirect(QUOTE_HUB_REDIRECTS[params.id] ?? '/quotes');
  }
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <QuoteDetailClient quoteId={params.id} />;
}
