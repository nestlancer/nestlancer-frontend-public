import { redirect } from 'next/navigation';

import { webAppUrl } from '../../lib/web-app-url';

export default function PortfolioPage() {
  redirect(webAppUrl('/portfolio'));
}
