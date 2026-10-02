import { describe, expect, it, afterEach } from 'vitest';

import { resolveApiUpstream, resolvePublicApiUrl, resolvePublicWsUrl } from './env';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('resolvePublicApiUrl', () => {
  it('uses override when provided', () => {
    expect(resolvePublicApiUrl('https://api.example.com/')).toBe('https://api.example.com');
  });

  it('uses NEXT_PUBLIC_API_URL when set', () => {
    delete process.env.API_UPSTREAM;
    process.env.NEXT_PUBLIC_API_URL = 'https://prod-api.example.com';
    process.env.NODE_ENV = 'production';
    expect(resolvePublicApiUrl()).toBe('https://prod-api.example.com');
  });

  it('prefers API_UPSTREAM on the server', () => {
    process.env.API_UPSTREAM = 'https://api.upstream.example.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://app.example.com';
    process.env.NODE_ENV = 'production';
    expect(resolvePublicApiUrl()).toBe('https://api.upstream.example.com');
  });

  it('falls back to dev-api only outside production', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.API_UPSTREAM;
    process.env.NODE_ENV = 'development';
    expect(resolvePublicApiUrl()).toBe('https://dev-api.nestlancer.com');
  });

  it('throws in production when missing', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.API_UPSTREAM;
    process.env.NODE_ENV = 'production';
    expect(() => resolvePublicApiUrl()).toThrow(/NEXT_PUBLIC_API_URL is required/);
  });
});

describe('resolvePublicWsUrl', () => {
  it('prefers NEXT_PUBLIC_WS_URL', () => {
    process.env.NEXT_PUBLIC_WS_URL = 'https://ws.example.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    expect(resolvePublicWsUrl()).toBe('https://ws.example.com');
  });

  it('rejects dev-api host in production builds (NL-BUG-PAY-003)', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_WS_URL = 'https://dev-api.nestlancer.com';
    expect(() => resolvePublicWsUrl()).toThrow(/dev-api/);
  });
});

describe('resolveApiUpstream', () => {
  it('prefers API_UPSTREAM', () => {
    process.env.API_UPSTREAM = 'http://gateway:3000';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    expect(resolveApiUpstream()).toBe('http://gateway:3000');
  });
});
