import type { Metadata } from 'next';
import { AdminPortfolioClient } from '@/features/portfolio/AdminPortfolioClient';

export const metadata: Metadata = { title: 'Portfolio' };

export default function PortfolioPage() {
  return <AdminPortfolioClient />;
}
