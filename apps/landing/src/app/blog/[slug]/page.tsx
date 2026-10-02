import { redirect } from 'next/navigation';

import { webAppUrl } from '../../../lib/web-app-url';

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  redirect(webAppUrl(`/blog/${params.slug}`));
}
