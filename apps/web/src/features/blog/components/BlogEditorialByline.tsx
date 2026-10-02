import type { BlogAuthorSummary } from '@nestlancer/types';
import { safeNavigationUrl } from '@nestlancer/utils';

import { formatBlogDateShort, readingTimeLabel } from '../blog-utils';

type Props = {
  author?: BlogAuthorSummary | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  commentCount?: number | null;
};

const EDITORIAL_LABEL = 'Nestlancer Editorial';

/**
 * Public article byline — admin-only authorship surfaces as studio editorial.
 */
export function BlogEditorialByline({ author, publishedAt, readingTime, commentCount }: Props) {
  const avatar = safeNavigationUrl(author?.avatar);
  const initials = 'NE';
  const metaParts: string[] = [];
  const date = formatBlogDateShort(publishedAt);
  if (date) metaParts.push(date);
  const rt = readingTimeLabel(readingTime);
  if (rt) metaParts.push(rt);
  if (commentCount != null && commentCount > 0) {
    metaParts.push(`${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground"
        aria-hidden
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-[hsl(var(--article-text))]">{EDITORIAL_LABEL}</p>
        {metaParts.length > 0 ? (
          <p className="text-xs text-[hsl(var(--article-meta))]">{metaParts.join(' · ')}</p>
        ) : null}
      </div>
    </div>
  );
}
