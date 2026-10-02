import type { BlogAuthorSummary, PublicBlogPost } from '@nestlancer/types';
import { safeNavigationUrl } from '@nestlancer/utils';

export function formatBlogDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function formatBlogDateShort(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function authorDisplayName(_author?: BlogAuthorSummary | null): string {
  // Public blog authorship is admin/studio-only.
  void _author;
  return 'Nestlancer Editorial';
}

export function authorInitials(author?: BlogAuthorSummary | null): string {
  const name = authorDisplayName(author);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function readingTimeLabel(minutes?: number | null): string {
  if (!minutes || minutes < 1) return '';
  return `${minutes} min read`;
}

export function estimateReadingMinutes(content: string, wpm = 200): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wpm));
}

/** Cover art for cards and article hero (SEO og image). */
export function postCoverImage(post: Pick<PublicBlogPost, 'seo'>): string | null {
  const url = post.seo?.ogImage?.trim();
  return safeNavigationUrl(url);
}

export function postSeoTitle(post: Pick<PublicBlogPost, 'title' | 'seo'>): string {
  const seo = post.seo;
  return seo?.metaTitle?.trim() || seo?.title?.trim() || post.title;
}

export function postSeoDescription(post: Pick<PublicBlogPost, 'excerpt' | 'seo'>): string {
  const seo = post.seo;
  return seo?.metaDescription?.trim() || seo?.description?.trim() || post.excerpt;
}

export function formatViewCount(count?: number | null): string {
  if (count == null || count < 1) return '';
  return `${count.toLocaleString()} views`;
}

export function postCardFooterMeta(
  post: Pick<PublicBlogPost, 'readingTime' | 'viewCount'>
): string {
  const parts: string[] = [];
  const rt = readingTimeLabel(post.readingTime);
  if (rt) parts.push(rt);
  const views = formatViewCount(post.viewCount);
  if (views) parts.push(views);
  return parts.join(' · ');
}

export function postMetaLine(
  post: Pick<PublicBlogPost, 'category' | 'publishedAt' | 'readingTime'>
): string {
  const parts: string[] = [];
  if (post.category?.name) parts.push(post.category.name);
  const date = formatBlogDateShort(post.publishedAt);
  if (date) parts.push(date);
  const rt = readingTimeLabel(post.readingTime);
  if (rt) parts.push(rt);
  return parts.join(' · ');
}

/** Decorative gradient per category slug — warm editorial teal family only. */
export function categoryAccentClass(slug?: string): string {
  const key = (slug ?? 'default').toLowerCase();
  const map: Record<string, string> = {
    product: 'from-primary/80 via-primary/50 to-emerald-900/40',
    engineering: 'from-slate-700/90 via-primary/35 to-slate-800/50',
    design: 'from-primary/60 via-brand-coral/40 to-amber-700/35',
    hiring: 'from-emerald-700/75 via-primary/55 to-teal-900/45',
    default: 'from-primary/75 via-primary/45 to-emerald-900/35',
  };
  for (const [prefix, cls] of Object.entries(map)) {
    if (key.includes(prefix)) return cls;
  }
  return map.default!;
}

/** Slug for heading anchor links — shared by SSR TOC and client markdown. */
export function slugifyMarkdownHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+={}[\]|\\:;"'<>,.?/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function walkMarkdownHeadings(
  content: string,
  onHeading: (level: number, text: string, id: string) => void
): void {
  const counts = new Map<string, number>();
  let inFence = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(trimmed);
    if (!match) continue;

    const marks = match[1] ?? '';
    const level = marks.length;
    const rawText = (match[2] ?? '').replace(/\[(.*?)\]\(.*?\)/g, '$1').trim();
    if (!rawText) continue;

    const base = slugifyMarkdownHeading(rawText) || 'section';
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    const id = seen === 0 ? base : `${base}-${seen + 1}`;
    onHeading(level, rawText, id);
  }
}

/**
 * Pre-compute stable heading IDs from markdown (atx headings h1–h3).
 * Avoids hydration mismatches from render-time Map mutation in ReactMarkdown.
 */
export function buildMarkdownHeadingIds(content: string): string[] {
  const ids: string[] = [];
  walkMarkdownHeadings(content, (_level, _text, id) => ids.push(id));
  return ids;
}

export type MarkdownTocItem = { id: string; text: string; level: 2 | 3 };

/**
 * Drop a leading markdown heading that repeats the post title (common CMS export).
 * Keeps heading IDs stable for TOC + BlogMarkdown.
 */
export function stripLeadingTitleHeading(markdown: string, title: string): string {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle || !markdown.trim()) return markdown;

  const lines = markdown.split('\n');
  let i = 0;
  while (i < lines.length && !lines[i]!.trim()) i += 1;
  if (i >= lines.length) return markdown;

  const match = /^(#{1,3})\s+(.+?)\s*$/.exec(lines[i]!.trim());
  if (!match) return markdown;

  const headingText = (match[2] ?? '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim()
    .toLowerCase();
  if (headingText !== normalizedTitle) return markdown;

  const next = [...lines];
  next.splice(i, 1);
  while (i < next.length && !next[i]!.trim()) next.splice(i, 1);
  return next.join('\n');
}

/** Table of contents from h2/h3 headings (uses the same IDs as BlogMarkdown). */
export function extractMarkdownToc(markdown: string): MarkdownTocItem[] {
  const toc: MarkdownTocItem[] = [];
  walkMarkdownHeadings(markdown, (level, text, id) => {
    if (level === 2 || level === 3) {
      toc.push({ id, text, level: level as 2 | 3 });
    }
  });
  return toc;
}
