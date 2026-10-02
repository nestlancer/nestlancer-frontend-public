import type { Metadata } from 'next';
import { ModerationClient } from '@/features/moderation/ModerationClient';

export const metadata: Metadata = { title: 'Moderation' };

export default function ModerationPage() {
  return <ModerationClient />;
}
