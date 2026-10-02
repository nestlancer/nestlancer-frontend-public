/**
 * Content-Security-Policy for Next.js apps.
 * In development, script-src includes 'unsafe-eval' for React Fast Refresh / webpack.
 *
 * Production uses per-request nonces when provided; otherwise falls back to
 * 'self' + trusted third-party script hosts (no unsafe-inline).
 *
 * Razorpay Standard Checkout loads checkout.js, risk-detection from cdn.razorpay.com,
 * and embeds payment UI in iframes from api.razorpay.com / checkout.razorpay.com.
 *
 * Cloudflare Turnstile loads challenges.cloudflare.com for the CAPTCHA widget.
 */
const isDev = process.env.NODE_ENV === 'development';

const RAZORPAY_SCRIPT_SRC =
  'https://checkout.razorpay.com https://cdn.razorpay.com';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com';
// NL-MEDIA-002: allow in-app PDF/image iframes from object storage / CDN.
const FRAME_SRC =
  "'self' https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com https://s3.nestlancer.com https://cdn.nestlancer.com";

export function contentSecurityPolicy(nonce) {
  const scriptSources = [`'self'`, RAZORPAY_SCRIPT_SRC, TURNSTILE_SCRIPT_SRC];
  if (isDev) {
    scriptSources.push("'unsafe-inline'", "'unsafe-eval'");
  } else if (nonce) {
    // Nonce for inline boot scripts; keep 'self' so Next.js _next/static bundles load.
    scriptSources.push(`'nonce-${nonce}'`);
  }

  const connectSrc = isDev
    ? "'self' https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*"
    : "'self' https: wss:";

  // NL-INFRA-001: no style-src-attr 'unsafe-inline'. Element styles use nonces;
  // attribute styles fall back to style-src / default-src ('self') — prefer classes
  // / CSS variables over React style={{…}} and Motion inline transforms.
  const styleSources = ["'self'", 'https:'];
  if (isDev) {
    styleSources.push("'unsafe-inline'");
  } else if (nonce) {
    styleSources.push(`'nonce-${nonce}'`);
  }

  const directives = [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https: data:",
    `style-src ${styleSources.join(' ')}`,
    `script-src ${scriptSources.join(' ')}`,
    `connect-src ${connectSrc}`,
    `frame-src ${FRAME_SRC}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return directives.join('; ');
}

/** Edge middleware helper: attach a nonce-based CSP to the response. */
export function applyContentSecurityPolicy(response, nonce) {
  if (isDev) return;
  response.headers.set('Content-Security-Policy', contentSecurityPolicy(nonce));
}
