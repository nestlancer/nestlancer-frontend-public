import type { Metadata } from 'next';
import { OperatorProfileClient } from '@/features/profile/OperatorProfileClient';

export const metadata: Metadata = { title: 'Profile' };

export default function OperatorProfilePage() {
  return <OperatorProfileClient />;
}
