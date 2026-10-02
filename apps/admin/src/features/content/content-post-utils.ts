import { rowId, rowTitle } from '@/lib/admin-response';

export type BlogPostRow = Record<string, unknown> & {
  id?: string;
  slug?: string;
  status?: string;
  featured?: boolean;
};

export function normalizeBlogPostRow(row: Record<string, unknown>): BlogPostRow {
  return row as BlogPostRow;
}

export function blogPostId(row: Record<string, unknown>): string {
  return rowId(row);
}

export function blogPostSlug(row: Record<string, unknown>): string {
  const slug = row.slug;
  return typeof slug === 'string' ? slug : '';
}

export function blogPostStatus(row: Record<string, unknown>): string {
  return String(row.status ?? 'DRAFT').toUpperCase();
}

export function blogPostTitle(row: Record<string, unknown>): string {
  return rowTitle(row);
}

export function blogPostCategoryName(row: Record<string, unknown>): string {
  const cat = row.category;
  if (cat && typeof cat === 'object') {
    return String((cat as Record<string, unknown>).name ?? '');
  }
  return '';
}

export function commentPostId(row: Record<string, unknown>): string {
  if (typeof row.postId === 'string') return row.postId;
  const post = row.post;
  if (post && typeof post === 'object') {
    const id = (post as Record<string, unknown>).id;
    if (typeof id === 'string') return id;
  }
  return '';
}

export function commentPostTitle(row: Record<string, unknown>): string {
  const post = row.post;
  if (post && typeof post === 'object') {
    const title = (post as Record<string, unknown>).title;
    if (typeof title === 'string' && title.length > 0) return title;
  }
  return '—';
}

export function commentPostSlug(row: Record<string, unknown>): string {
  const post = row.post;
  if (post && typeof post === 'object') {
    const slug = (post as Record<string, unknown>).slug;
    if (typeof slug === 'string') return slug;
  }
  return '';
}
