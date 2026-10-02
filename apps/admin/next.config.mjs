import '@nestlancer/config/load-root-env.mjs';
import { contentSecurityPolicy } from '@nestlancer/config/csp.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Nginx serves dev-admin.nestlancer.com → container :9010; allow dev asset requests.
  allowedDevOrigins: ['dev-admin.nestlancer.com', '*.nestlancer.com'],
  transpilePackages: [
    '@nestlancer/ui',
    '@nestlancer/api-client',
    '@nestlancer/auth',
    '@nestlancer/field-help',
    '@nestlancer/types',
    '@nestlancer/utils',
    '@nestlancer/constants',
  ],
  // These workspace packages expose broad barrel files. Rewriting named imports
  // prevents every route from parsing the entire UI and generated API surface.
  experimental: {
    instrumentationHook: true,
    optimizePackageImports: ['@nestlancer/ui', '@nestlancer/api-client'],
  },
  /**
   * `/api/v1/*` is proxied at request time by `app/api/v1/[...path]/route.ts`.
   * Build-time rewrites baked the public API host and hairpinned every call.
   */
  async redirects() {
    return [{ source: '/pipelines', destination: '/pipeline', permanent: true }];
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
