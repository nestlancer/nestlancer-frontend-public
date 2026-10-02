import type { MetadataRoute } from 'next';

import { getSiteOrigin } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/payments',
          '/invoices',
          '/projects',
          '/quotes',
          '/requests',
          '/messages',
          '/settings',
          '/notifications',
          '/profile',
          '/login',
          '/register',
          '/api/',
          '/share/',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
