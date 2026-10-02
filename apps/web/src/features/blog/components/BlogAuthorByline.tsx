import type { BlogAuthorSummary } from '@nestlancer/types';
import { safeNavigationUrl } from '@nestlancer/utils';

import {
  authorDisplayName,
  authorInitials,
  formatBlogDateShort,
  readingTimeLabel,
} from '../blog-utils';

type Props = {
  author?: BlogAuthorSummary | null;
  publishedAt?: string | null;
  readingTime?: number | null;
};

export function BlogAuthorByline({ author, publishedAt, readingTime }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-primary-foreground"
        aria-hidden
      >
        {safeNavigationUrl(author?.avatar) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeNavigationUrl(author?.avatar) ?? undefined}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          authorInitials(author)
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{authorDisplayName(author)}</p>
        <p className="text-xs text-muted-foreground">
          {formatBlogDateShort(publishedAt)}
          {readingTime ? ` · ${readingTimeLabel(readingTime)}` : ''}
        </p>
      </div>
    </div>
  );
}
