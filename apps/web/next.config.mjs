import '@nestlancer/config/load-root-env.mjs';
import { contentSecurityPolicy } from '@nestlancer/config/csp.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Nginx/Caddy serves dev-app.nestlancer.com → container :9000; allow dev asset requests.
  allowedDevOrigins: ['dev-app.nestlancer.com', '*.nestlancer.com'],
  transpilePackages: [
    '@nestlancer/ui',
    '@nestlancer/api-client',
    '@nestlancer/websocket',
    '@nestlancer/auth',
    '@nestlancer/field-help',
    '@nestlancer/types',
    '@nestlancer/utils',
    '@nestlancer/config',
    '@nestlancer/constants',
    '@nestlancer/validators',
    '@nestlancer/hooks',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dev-api.nestlancer.com' },
      { protocol: 'https', hostname: 'dev-app.nestlancer.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'storage.nestlancer.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    instrumentationHook: true,
    // lucide-react is optimized by Next.js already. These workspace barrels are
    // the expensive ones: api-client re-exports thousands of generated models.
    optimizePackageImports: ['@nestlancer/ui', '@nestlancer/api-client'],
  },
  /**
   * `/api/v1/*` is proxied at request time by `app/api/v1/[...path]/route.ts`.
   * A build-time rewrite baked `API_UPSTREAM` into the image (often the public
   * API host), so every browser call hairpinned back through TLS.
   */
  async redirects() {
    const landing = (
      process.env.NEXT_PUBLIC_LANDING_URL?.trim() ||
      (process.env.NODE_ENV === 'production' ? 'https://nestlancer.com' : '')
    ).replace(/\/$/, '');

    /**
     * App host (`app.nestlancer.com`) serves the client portal.
     * `/` stays on the app host as the portal entry (`/login`) — do not bounce to apex
     * (NL-HOST-001). Marketing pages still canonicalize to the landing/apex host.
     */
    // `/` → `/login` is handled in middleware so the 307 carries production CSP.
    const toLanding = landing
      ? [
          { source: '/about', destination: `${landing}/about`, permanent: false },
          { source: '/pricing', destination: `${landing}/pricing`, permanent: false },
          { source: '/services', destination: `${landing}/services`, permanent: false },
          { source: '/how-it-works', destination: `${landing}/#how-it-works`, permanent: false },
        ]
      : [
          { source: '/how-it-works', destination: '/login', permanent: false },
          { source: '/pricing', destination: '/login', permanent: false },
          { source: '/services', destination: '/portfolio', permanent: false },
        ];

    return [
      ...toLanding,
      { source: '/post-request', destination: '/register', permanent: false },
      { source: '/request', destination: '/register', permanent: false },
      // NL-CLIENT-003: notifications historically used path-style hub deep links;
      // hub tabs are query-param based (`?tab=`).
      {
        source: '/projects/:id/overview',
        destination: '/projects/:id',
        permanent: false,
      },
      {
        source: '/projects/:id/progress',
        destination: '/projects/:id?tab=progress',
        permanent: false,
      },
      {
        source: '/projects/:id/milestones',
        destination: '/projects/:id?tab=milestones',
        permanent: false,
      },
      {
        source: '/projects/:id/deliverables',
        destination: '/projects/:id?tab=deliverables',
        permanent: false,
      },
      {
        source: '/projects/:id/messages',
        destination: '/projects/:id?tab=messages',
        permanent: false,
      },
      {
        source: '/projects/:id/files',
        destination: '/projects/:id?tab=files',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          ...(process.env.NODE_ENV === 'development'
            ? [
                {
                  key: 'Content-Security-Policy',
                  value: contentSecurityPolicy(),
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
