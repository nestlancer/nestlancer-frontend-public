import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Files' };

import { MediaLibraryClient } from '@/features/media/MediaLibraryClient';

export default function Page() {
  return <MediaLibraryClient />;
}
