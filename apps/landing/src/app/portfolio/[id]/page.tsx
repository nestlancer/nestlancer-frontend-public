import { redirect } from 'next/navigation';

import { webAppUrl } from '../../../lib/web-app-url';

export default function PortfolioDetailPage({ params }: { params: { id: string } }) {
  redirect(webAppUrl(`/portfolio/${params.id}`));
}
