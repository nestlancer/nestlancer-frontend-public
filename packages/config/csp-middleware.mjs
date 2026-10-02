import { NextResponse } from 'next/server';

import { applyContentSecurityPolicy } from './csp.mjs';

/** Generate a per-request CSP nonce. */
export function createCspNonce() {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

/**
 * Build a NextResponse.next() that forwards the nonce to the App Router via request headers.
 * Next.js reads `x-nonce` and applies it to bundled script tags.
 */
export function nextWithCspNonce(request, nonce) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/** Attach CSP + response nonce header to any middleware response. */
export function applyCspNonce(response, nonce) {
  applyContentSecurityPolicy(response, nonce);
  response.headers.set('x-nonce', nonce);
  return response;
}

/**
 * Wrap a page middleware handler: inject nonce on request (for SSR scripts) and CSP on response.
 * Redirect responses skip request-header forwarding (no HTML shell).
 */
export function withCspMiddleware(handler) {
  return function cspMiddleware(request) {
    const nonce = createCspNonce();
    const result = handler(request, nonce);
    if (result instanceof Promise) {
      return result.then((response) => finalizeCspMiddleware(request, response, nonce));
    }
    return finalizeCspMiddleware(request, response, nonce);
  };
}

/**
 * Attach CSP while preserving middleware control flow.
 * Rewrites and terminal responses (hard 404 bodies) must not be collapsed into
 * NextResponse.next() — that was wiping /users/bulk → hard-404 (NL-UI-RERUN-002).
 */
function finalizeWithCsp(request, response, nonce) {
  if (!(response instanceof NextResponse)) {
    return response;
  }

  const isRedirect = response.status >= 300 && response.status < 400;
  if (isRedirect || !request) {
    return applyCspNonce(response, nonce);
  }

  const rewriteTo = response.headers.get('x-middleware-rewrite');
  if (rewriteTo) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    const out = NextResponse.rewrite(new URL(rewriteTo, request.url), {
      request: { headers: requestHeaders },
    });
    response.cookies.getAll().forEach((cookie) => {
      out.cookies.set(cookie);
    });
    return applyCspNonce(out, nonce);
  }

  // Terminal middleware body (e.g. hard 404 HTML) — keep status/body.
  const isMiddlewareNext = response.headers.get('x-middleware-next') === '1';
  if (!isMiddlewareNext) {
    return applyCspNonce(response, nonce);
  }

  const out = nextWithCspNonce(request, nonce);
  response.cookies.getAll().forEach((cookie) => {
    out.cookies.set(cookie);
  });
  return applyCspNonce(out, nonce);
}

function finalizeCspMiddleware(request, response, nonce) {
  return finalizeWithCsp(request, response, nonce);
}

/** @deprecated Use applyCspNonce + nextWithCspNonce */
export function withCspNonce(response, request) {
  return finalizeWithCsp(request, response, createCspNonce());
}
