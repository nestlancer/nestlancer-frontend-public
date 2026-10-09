import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { createAuthMiddleware } from './middleware';
import { REFRESH_TOKEN_COOKIE } from './tokenManager';

function requestFor(pathname: string, cookieHeader?: string): NextRequest {
  const headers = new Headers();
  if (cookieHeader) headers.set('cookie', cookieHeader);
  return new NextRequest(`https://app.example.com${pathname}`, { headers });
}

describe('createAuthMiddleware', () => {
  it('treats /blog as public by default', () => {
    const auth = createAuthMiddleware();
    const res = auth(requestFor('/blog/some-post'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects /blog/bookmarks when listed as protected under public /blog (NL-BUG-P43-001)', () => {
    const auth = createAuthMiddleware({
      protectedPrefixes: ['/blog/bookmarks'],
    });
    const res = auth(requestFor('/blog/bookmarks'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login?from=%2Fblog%2Fbookmarks');
  });

  it('allows /blog/bookmarks when a refresh cookie is present', () => {
    const auth = createAuthMiddleware({
      protectedPrefixes: ['/blog/bookmarks'],
    });
    const res = auth(requestFor('/blog/bookmarks', `${REFRESH_TOKEN_COOKIE}=rtok`));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});
