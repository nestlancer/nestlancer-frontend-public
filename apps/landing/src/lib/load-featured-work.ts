import { resolvePublicApiUrl } from '@nestlancer/config';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';

export type FeaturedWorkCard = {
  title: string;
  slug: string;
  subtitle: string;
  tag: string;
  gradient: string;
  imageUrl: string | null;
};

const FALLBACK_WORK: FeaturedWorkCard[] = [
  {
    title: 'Fintech Payments Hub',
    slug: 'fintech-payments-hub',
    subtitle: 'Razorpay, UPI rails, and milestone clarity',
    tag: 'Fintech',
    gradient: 'from-[#123] to-[#0a2e28]',
    imageUrl: null,
  },
  {
    title: 'B2B Portal UX',
    slug: 'b2b-portal-ux',
    subtitle: 'Operator workflows that stay auditable',
    tag: 'Product',
    gradient: 'from-[#1a1030] to-[#0c1a2e]',
    imageUrl: null,
  },
  {
    title: 'Checkout & UPI Flow',
    slug: 'checkout-upi-flow',
    subtitle: 'India-first payment UX that converts',
    tag: 'Payments',
    gradient: 'from-[#2a1508] to-[#0e2218]',
    imageUrl: null,
  },
];

const GRADIENTS = [
  'from-[#123] to-[#0a2e28]',
  'from-[#1a1030] to-[#0c1a2e]',
  'from-[#2a1508] to-[#0e2218]',
] as const;

function unwrapItems(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
  if (raw && typeof raw === 'object') {
    const o = raw as { data?: unknown; items?: unknown };
    if (Array.isArray(o.items)) return o.items as Array<Record<string, unknown>>;
    if (Array.isArray(o.data)) return o.data as Array<Record<string, unknown>>;
    if (o.data && typeof o.data === 'object') {
      const nested = o.data as { items?: unknown; data?: unknown };
      if (Array.isArray(nested.items)) return nested.items as Array<Record<string, unknown>>;
      if (Array.isArray(nested.data)) return nested.data as Array<Record<string, unknown>>;
    }
  }
  return [];
}

function firstUrlFromMedia(list: unknown): string | null {
  if (!Array.isArray(list)) return null;
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as { url?: unknown; kind?: unknown };
    const url = typeof row.url === 'string' ? row.url.trim() : '';
    if (!url) continue;
    const kind = typeof row.kind === 'string' ? row.kind.toUpperCase() : '';
    if (kind && kind !== 'IMAGE') continue;
    return url;
  }
  return null;
}

/** Prefer the case-study thumbnail, then gallery / preview images. */
export function pickCoverImage(row: Record<string, unknown>): string | null {
  const direct = [row.thumbnailUrl, row.coverUrl, row.imageUrl, row.thumbnail];
  for (const value of direct) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return firstUrlFromMedia(row.gallery) ?? firstUrlFromMedia(row.previewMedia);
}

function toCard(row: Record<string, unknown>, index: number): FeaturedWorkCard | null {
  const slug = String(row.slug ?? '').trim();
  const title = String(row.title ?? '').trim();
  if (!slug || !title) return null;
  const category =
    row.category && typeof row.category === 'object'
      ? String((row.category as { name?: unknown }).name ?? 'Case study')
      : 'Case study';
  const subtitle =
    typeof row.shortDescription === 'string' && row.shortDescription.trim()
      ? row.shortDescription.trim()
      : 'Studio case study';
  return {
    title,
    slug,
    subtitle,
    tag: category,
    gradient: GRADIENTS[index % GRADIENTS.length]!,
    imageUrl: pickCoverImage(row),
  };
}

/** Featured portfolio cards for the landing “Selected work” section. */
export async function loadFeaturedWork(limit = 8): Promise<FeaturedWorkCard[]> {
  const origin = resolvePublicApiUrl().replace(/\/$/, '');
  try {
    const headers = new Headers({ Accept: 'application/json' });
    applyCorrelationHeaders(headers, resolveCorrelationId({ headers }));
    // Parallelize featured + list so a short featured set does not add a second RTT.
    const [featuredRes, listRes] = await Promise.all([
      fetch(`${origin}/api/v1/portfolio/featured`, {
        headers,
        next: { revalidate: 300 },
      }),
      fetch(`${origin}/api/v1/portfolio?page=1&limit=${limit}`, {
        headers,
        next: { revalidate: 300 },
      }),
    ]);
    const rows = featuredRes.ok ? unwrapItems(await featuredRes.json()) : [];

    if (rows.length < limit && listRes.ok) {
      const more = unwrapItems(await listRes.json());
      const seen = new Set(rows.map((r) => String(r.slug ?? r.id ?? '')));
      for (const row of more) {
        const key = String(row.slug ?? row.id ?? '');
        if (!key || seen.has(key)) continue;
        rows.push(row);
        seen.add(key);
        if (rows.length >= limit) break;
      }
    }

    const cards: FeaturedWorkCard[] = [];
    for (let i = 0; i < Math.min(rows.length, limit); i++) {
      const row = rows[i];
      if (!row) continue;
      const card = toCard(row, i);
      if (card) cards.push(card);
    }
    if (cards.length > 0) return cards;
  } catch {
    // Fall through.
  }
  if (process.env.NODE_ENV === 'development') {
    return FALLBACK_WORK.slice(0, limit);
  }
  return [];
}
