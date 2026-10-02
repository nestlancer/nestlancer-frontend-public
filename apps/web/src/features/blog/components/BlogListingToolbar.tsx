'use client';

import { cn } from '@nestlancer/ui';

import { BlogSearchClient } from '../BlogSearchClient';

type Props = {
  className?: string;
};

/** Search bar for blog listing main column (categories live in sidebar). */
export function BlogListingToolbar({ className }: Props) {
  return (
    <div className={cn('w-full sm:max-w-sm', className)}>
      <BlogSearchClient />
    </div>
  );
}
