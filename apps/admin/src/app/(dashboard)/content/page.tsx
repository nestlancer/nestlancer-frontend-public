import type { Metadata } from 'next';
import { ContentClient } from '@/features/content/ContentClient';

export const metadata: Metadata = { title: 'Content' };

export default function ContentPage() {
  return <ContentClient />;
}
