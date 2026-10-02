import { describe, expect, it, afterEach } from 'vitest';

import { assertSameOrigin } from './assertSameOrigin';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

function req(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { method: 'POST', headers });
}

describe('assertSameOrigin', () => {
  it('allows matching Origin', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:9000';
    const result = assertSameOrigin(
      req('http://localhost:9000/api/auth/login', { origin: 'http://localhost:9000' })
    );
    expect(result).toBeNull();
  });

  it('rejects cross-site Origin', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:9000';
    const result = assertSameOrigin(
      req('http://localhost:9000/api/auth/login', { origin: 'https://evil.example' })
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const body = await result!.json();
    expect(body.message).toMatch(/cross-origin/i);
  });

  it('allows matching Referer when Origin is absent', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:9000';
    const result = assertSameOrigin(
      req('http://localhost:9000/api/auth/refresh', {
        referer: 'http://localhost:9000/login',
      })
    );
    expect(result).toBeNull();
  });

  it('allows https Origin when request URL is http behind TLS terminator', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.nestlancer.com';
    const result = assertSameOrigin(
      req('http://0.0.0.0:9000/api/auth/login', {
        origin: 'https://app.nestlancer.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'app.nestlancer.com',
      })
    );
    expect(result).toBeNull();
  });

  it('rejects a forwarded host that is not one of the configured app hosts', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.nestlancer.com';
    const result = assertSameOrigin(
      req('http://0.0.0.0:9000/api/auth/login', {
        origin: 'https://evil.example',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'evil.example',
      })
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('allows Origin matching NEXT_PUBLIC_WEB_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://admin.nestlancer.com';
    process.env.NEXT_PUBLIC_WEB_URL = 'https://app.nestlancer.com';
    const result = assertSameOrigin(
      req('http://0.0.0.0:9000/api/auth/login', { origin: 'https://app.nestlancer.com' })
    );
    expect(result).toBeNull();
  });
});
