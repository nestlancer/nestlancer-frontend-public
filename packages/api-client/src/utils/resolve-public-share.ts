/**
 * Public share link (no auth). Uses browser fetch against the API gateway.
 * Passwords are sent via POST body — never in the URL.
 */

export class PublicShareError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'PublicShareError';
    this.status = status;
    this.code = code;
  }
}

function friendlyShareMessage(
  status: number,
  code: string | null,
  apiMessage: string | null
): string {
  const lower = (apiMessage ?? '').toLowerCase();
  if (lower.includes('password')) {
    return apiMessage!.trim();
  }
  if (status === 401 || status === 403 || code === 'FORBIDDEN' || code === 'UNAUTHORIZED') {
    return 'Password required to unlock this file.';
  }
  if (status === 410 || code === 'GONE' || lower.includes('expired')) {
    return 'This share link is invalid or has expired.';
  }
  if (status === 404 || code === 'NOT_FOUND') {
    return 'This share link is invalid or has expired.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  return 'This share link is invalid or has expired.';
}

export async function resolvePublicShare(
  token: string,
  options?: { password?: string; apiOrigin?: string }
): Promise<Record<string, unknown>> {
  const origin =
    options?.apiOrigin ??
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined) ??
    '';
  const base = origin.replace(/\/$/, '');

  const hasPassword = Boolean(options?.password);
  const url = `${base}/api/v1/share/${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: hasPassword ? 'POST' : 'GET',
    credentials: 'omit',
    headers: hasPassword ? { 'Content-Type': 'application/json' } : undefined,
    body: hasPassword ? JSON.stringify({ password: options!.password }) : undefined,
  });

  if (!res.ok) {
    let code: string | null = null;
    let apiMessage: string | null = null;
    try {
      const body = (await res.json()) as {
        error?: { code?: unknown; message?: unknown };
        message?: unknown;
      };
      if (typeof body?.error?.code === 'string') code = body.error.code;
      if (typeof body?.error?.message === 'string') apiMessage = body.error.message;
      else if (typeof body?.message === 'string') apiMessage = body.message;
    } catch {
      // ignore parse failures
    }
    throw new PublicShareError(
      friendlyShareMessage(res.status, code, apiMessage),
      res.status,
      code
    );
  }
  const json = (await res.json()) as Record<string, unknown>;
  const data =
    json.data && typeof json.data === 'object' ? (json.data as Record<string, unknown>) : json;
  return data;
}
