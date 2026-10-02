import { format as formatDate, formatDistanceToNow } from 'date-fns';

/** Amounts in API/DB for INR are stored in paise (smallest unit). */
export function fromPaise(paise: number): number {
  return paise / 100;
}

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format a major-unit amount (e.g. rupees) as currency.
 * For API/DB integers in paise, use `formatMoneyFromPaise` instead.
 */
export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/** Format paise as INR (or other currency) for display. */
export function formatMoneyFromPaise(
  paise: number,
  currency = 'INR',
  locale = currency === 'INR' ? 'en-IN' : 'en-US'
): string {
  return formatCurrency(fromPaise(paise), currency, locale);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(decimals)} ${sizes[i]}`;
}

export function formatIsoDate(iso: string, pattern = 'PP'): string {
  return formatDate(new Date(iso), pattern);
}

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

/** Best display date for a portfolio / showcase project (newest signal first). */
export function resolvePortfolioProjectDate(item: {
  publishedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): Date | null {
  const raw = item.publishedAt ?? item.completedAt ?? item.createdAt ?? item.updatedAt;
  if (!raw) return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Timeline label — e.g. "Mar 2024". */
export function formatPortfolioProjectDate(
  item: Parameters<typeof resolvePortfolioProjectDate>[0],
  locale = 'en-US'
): string {
  const d = resolvePortfolioProjectDate(item);
  if (!d) return '—';
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(d);
}

/** Calendar year for timeline grouping — e.g. "2024". */
export function formatPortfolioProjectYear(
  item: Parameters<typeof resolvePortfolioProjectDate>[0]
): string | null {
  const d = resolvePortfolioProjectDate(item);
  if (!d) return null;
  return String(d.getFullYear());
}

export function comparePortfolioByDateDesc(
  a: Parameters<typeof resolvePortfolioProjectDate>[0],
  b: Parameters<typeof resolvePortfolioProjectDate>[0]
): number {
  const da = resolvePortfolioProjectDate(a)?.getTime() ?? 0;
  const db = resolvePortfolioProjectDate(b)?.getTime() ?? 0;
  return db - da;
}
