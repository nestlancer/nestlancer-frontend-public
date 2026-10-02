import { rowId, rowTitle } from '@/lib/admin-response';

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  categoryName: string;
  publishedAt?: string;
  readingTime?: number;
  viewCount?: number;
};

export type CommentPostLink = {
  postId: string;
  postTitle: string;
  postSlug: string;
};

export function getPublicWebOrigin(): string {
  const candidates = [
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_WEB_URL : undefined,
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : undefined,
    typeof process !== 'undefined' ? process.env.APP_ORIGIN : undefined,
  ];
  for (const raw of candidates) {
    const origin = (raw ?? '').trim().replace(/\/$/, '');
    if (!origin) continue;
    if (/localhost|127\.0\.0\.1/.test(origin)) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') continue;
    }
    return origin;
  }
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'https://app.nestlancer.com';
  }
  return 'http://localhost:9000';
}

export function publicPostUrl(slug: string): string {
  return `${getPublicWebOrigin()}/blog/${encodeURIComponent(slug)}`;
}

export function editPostPath(postId: string): string {
  return `/content/posts/${encodeURIComponent(postId)}/edit`;
}

export function normalizeBlogPostRow(row: Record<string, unknown>): BlogPostRow | null {
  const id = rowId(row);
  if (!id) return null;

  const category =
    row.category && typeof row.category === 'object'
      ? (row.category as Record<string, unknown>)
      : null;

  return {
    id,
    title: rowTitle(row),
    slug: typeof row.slug === 'string' ? row.slug : '',
    status: String(row.status ?? 'DRAFT').toUpperCase(),
    featured: Boolean(row.featured),
    categoryName: category ? String(category.name ?? '') : '',
    publishedAt: typeof row.publishedAt === 'string' ? row.publishedAt : undefined,
    readingTime: typeof row.readingTime === 'number' ? row.readingTime : undefined,
    viewCount: typeof row.viewCount === 'number' ? row.viewCount : undefined,
  };
}

export function commentPostLink(row: Record<string, unknown>): CommentPostLink {
  const post =
    row.post && typeof row.post === 'object' ? (row.post as Record<string, unknown>) : null;
  return {
    postId: post ? rowId(post) : '',
    postTitle: post ? rowTitle(post) : '—',
    postSlug: post && typeof post.slug === 'string' ? post.slug : '',
  };
}

export function statusTone(status: string): 'good' | 'warn' | 'neutral' {
  if (status === 'PUBLISHED' || status === 'APPROVED') return 'good';
  if (status === 'DRAFT' || status === 'PENDING' || status === 'SCHEDULED') return 'warn';
  return 'neutral';
}
