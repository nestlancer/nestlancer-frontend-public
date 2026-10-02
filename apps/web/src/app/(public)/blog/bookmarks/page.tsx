import type { Metadata } from 'next';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { BlogBookmarksClient } from '@/features/blog/BlogBookmarksClient';

export const metadata: Metadata = {
  title: 'Bookmarks',
};

export default function BlogBookmarksPage() {
  return (
    <RequireAuth>
      <BlogBookmarksClient />
    </RequireAuth>
  );
}
