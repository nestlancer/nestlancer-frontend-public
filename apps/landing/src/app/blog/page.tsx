import { redirect } from 'next/navigation';

import { webAppUrl } from '../../lib/web-app-url';

export default function BlogPage() {
  redirect(webAppUrl('/blog'));
}
