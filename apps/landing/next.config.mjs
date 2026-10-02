import '@nestlancer/config/load-root-env.mjs';
import { contentSecurityPolicy } from '@nestlancer/config/csp.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Nginx/Caddy serves dev-landing.nestlancer.com → container :9020; allow dev asset requests.
  allowedDevOrigins: ['dev-landing.nestlancer.com', '*.nestlancer.com'],
  transpilePackages: ['@nestlancer/ui', '@nestlancer/config', '@nestlancer/utils'],
  experimental: {
    instrumentationHook: true,
  },
  /**
   * `/api/v1/*` is proxied at request time by `app/api/v1/[...path]/route.ts`
   * so the upstream is the runtime `API_UPSTREAM`, not a host baked at build.
   */
  // Do NOT bake absolute /blog|/portfolio|/terms|/privacy redirects here.
  // Build-time NEXT_PUBLIC_APP_URL (often localhost in prod-local Docker) was shipping
  // dead Location headers on nestlancer.com. Middleware + page redirects resolve the
  // web-app origin at request time (host-aware / APP_ORIGIN).
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
