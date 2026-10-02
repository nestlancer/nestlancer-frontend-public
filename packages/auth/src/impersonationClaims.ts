export interface ImpersonationClaims {
  sub: string;
  email?: string;
  sessionId: string;
  exp: number;
}

function decodeBase64Url(segment: string): string {
  const padded =
    segment.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (segment.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Reads impersonation claims without verifying the signature.
 * The gateway still verifies the token on every API call. This only rejects
 * tokens that are not a client-portal support session before we store them.
 */
export function readImpersonationClaims(token: string): ImpersonationClaims | null {
  if (typeof token !== 'string') return null;
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 8000) return null;
  const parts = trimmed.split('.');
  const payloadSegment = parts[1];
  if (parts.length !== 3 || !payloadSegment || parts.some((part) => part.length === 0)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as Record<string, unknown>;
    if (payload.isImpersonated !== true) return null;
    if (payload.type !== 'access') return null;
    if (payload.portal !== 'client') return null;
    if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 80) {
      return null;
    }
    if (
      typeof payload.impersonationSessionId !== 'string' ||
      payload.impersonationSessionId.length === 0 ||
      payload.impersonationSessionId.length > 80
    ) {
      return null;
    }
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
    const expiresAtMs = payload.exp * 1000;
    if (expiresAtMs <= Date.now()) return null;
    if (expiresAtMs > Date.now() + 5 * 60 * 60 * 1000) return null;

    const email =
      typeof payload.email === 'string' && payload.email.length > 0 && payload.email.length <= 320
        ? payload.email
        : undefined;

    return {
      sub: payload.sub,
      email,
      sessionId: payload.impersonationSessionId,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
