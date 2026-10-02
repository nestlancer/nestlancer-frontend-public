import { afterEach, describe, expect, it } from 'vitest';

import { GET } from './route';

const env = process.env as Record<string, string | undefined>;
const ORIGINAL_APP_URL = env.NEXT_PUBLIC_APP_URL;
const ORIGINAL_NODE_ENV = env.NODE_ENV;

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete env.NEXT_PUBLIC_APP_URL;
  else env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
  env.NODE_ENV = ORIGINAL_NODE_ENV;
});

function callback(headers: Record<string, string>, code = 'junk'): Request {
  return new Request(`http://0.0.0.0:9000/api/auth/callback?code=${code}`, { headers });
}

describe('auth callback redirect origin', () => {
  it('uses NEXT_PUBLIC_APP_URL and ignores a forwarded host', async () => {
    env.NEXT_PUBLIC_APP_URL = 'https://app.nestlancer.com';
    const res = await GET(
      callback({
        'x-forwarded-host': 'evil.example',
        'x-forwarded-proto': 'https',
      })
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toBe(
      'https://app.nestlancer.com/login?error=invalid_callback'
    );
  });

  it('does not follow an untrusted forwarded host when the public app URL is unset', async () => {
    delete env.NEXT_PUBLIC_APP_URL;
    env.NODE_ENV = 'production';
    const res = await GET(
      callback({
        'x-forwarded-host': 'evil.example',
        'x-forwarded-proto': 'https',
      })
    );
    const location = res.headers.get('location') ?? '';
    expect(location.startsWith('https://evil.example')).toBe(false);
    expect(new URL(location).hostname).toBe('app.nestlancer.com');
  });

  it('keeps a trusted forwarded host when the public app URL is unset', async () => {
    delete env.NEXT_PUBLIC_APP_URL;
    const res = await GET(
      callback({
        'x-forwarded-host': 'dev-app.nestlancer.com',
        'x-forwarded-proto': 'https',
      })
    );
    expect(res.headers.get('location')).toBe(
      'https://dev-app.nestlancer.com/login?error=invalid_callback'
    );
  });

  it('does not treat an OAuth code as a signed-in session', async () => {
    env.NEXT_PUBLIC_APP_URL = 'https://app.nestlancer.com';
    const res = await GET(
      callback(
        {
          'x-forwarded-host': 'evil.example',
          'x-forwarded-proto': 'https',
        },
        'real-auth-code'
      )
    );
    expect(res.headers.get('location')).toBe(
      'https://app.nestlancer.com/login?error=invalid_callback'
    );
  });

  it('rejects a scheme smuggled in x-forwarded-proto', async () => {
    delete env.NEXT_PUBLIC_APP_URL;
    env.NODE_ENV = 'production';
    const res = await GET(
      callback({
        host: 'localhost:9000',
        'x-forwarded-proto': 'https://evil.example',
      })
    );
    const location = res.headers.get('location') ?? '';
    expect(new URL(location).hostname).not.toBe('evil.example');
    expect(new URL(location).protocol).toBe('http:');
    expect(new URL(location).hostname).toBe('localhost');
  });
});
