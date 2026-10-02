import type { Metadata } from 'next';
import { AdminPortfolioEditorClient } from '@/features/portfolio/AdminPortfolioEditorClient';

export const metadata: Metadata = { title: 'New portfolio item' };

export default function NewPortfolioPage() {
  return <AdminPortfolioEditorClient />;
}
