import type { Metadata } from 'next';
import { AdminPortfolioEditorClient } from '@/features/portfolio/AdminPortfolioEditorClient';

export const metadata: Metadata = { title: 'Edit portfolio' };

export default function EditPortfolioPage({ params }: { params: { id: string } }) {
  return <AdminPortfolioEditorClient itemId={params.id} />;
}
