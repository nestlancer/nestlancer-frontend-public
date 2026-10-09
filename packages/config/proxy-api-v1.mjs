/**
 * Runtime proxy for same-origin `/api/v1/*`.
 * Reads `API_UPSTREAM` on each request so a production image does not bake the
 * public API host into a rewrite (that path hairpins through TLS and stalls).
 */

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function trimSlash(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function hostOf(value) {
  try {
    return new URL(value).host;
  } catch {
    return '';
  }
}

export function resolveApiProxyUpstream(requestHost) {
  const upstream = trimSlash(process.env.API_UPSTREAM);
  const publicApi = trimSlash(process.env.NEXT_PUBLIC_API_URL);
  const candidate = upstream || publicApi;
  if (!candidate) return '';
  const candidateHost = hostOf(candidate);
  if (requestHost && candidateHost && candidateHost === requestHost) return '';
  return candidate;
}

export async function proxyApiV1(request, pathSegments) {
  const requestHost = hostOf(request.url);
  const upstream = resolveApiProxyUpstream(requestHost);
  if (!upstream) {
    return Response.json({ message: 'API upstream is not configured' }, { status: 502 });
  }

  const parts = Array.isArray(pathSegments) ? pathSegments.filter(Boolean) : [];
  const incoming = new URL(request.url);
  const target = `${upstream}/api/v1/${parts.join('/')}${incoming.search}`;

  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  // BFF keeps refresh/impersonation in HttpOnly cookies; API auth is Bearer only.
  // Never forward browser auth cookies to the gateway (NL-BV-F1-03).
  headers.delete('cookie');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  const upstreamRes = await fetch(target, init);
  const outHeaders = new Headers(upstreamRes.headers);
  for (const name of HOP_BY_HOP) outHeaders.delete(name);
  outHeaders.delete('content-encoding');
  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: outHeaders,
  });
}
