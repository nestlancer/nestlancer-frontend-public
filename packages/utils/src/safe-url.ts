const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const NAV_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function decodeSafely(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/** Same-origin path safe for `next/link`. Rejects protocol-relative and scheme tricks. */
export function safeInAppPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) return null;
  if (hasControlChars(trimmed)) return null;
  const decoded = decodeSafely(trimmed);
  if (!decoded) return null;
  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    hasControlChars(decoded)
  ) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return null;
  return trimmed;
}

/**
 * Absolute http(s) URL, or mailto when requested.
 * Returns the original string so presigned query signatures are not re-encoded.
 */
export function safeHttpUrl(
  value: string | null | undefined,
  options?: { mailto?: boolean }
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.includes('\\') || hasControlChars(trimmed)) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const allowed = options?.mailto ? NAV_PROTOCOLS : HTTP_PROTOCOLS;
  if (!allowed.has(url.protocol)) return null;
  if (url.username || url.password) return null;
  return trimmed;
}

/** Link or media target: safe absolute URL, in-app path, hash, or relative path. */
export function safeNavigationUrl(
  value: string | null | undefined,
  options?: { mailto?: boolean }
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || hasControlChars(trimmed) || trimmed.includes('\\') || trimmed.startsWith('//')) {
    return null;
  }
  if (trimmed.startsWith('/')) return safeInAppPath(trimmed);
  if (trimmed.startsWith('#')) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return safeHttpUrl(trimmed, options);
  const decoded = decodeSafely(trimmed);
  if (!decoded || hasControlChars(decoded) || decoded.includes('\\') || decoded.startsWith('//')) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return null;
  return trimmed;
}

/** Open an http(s) URL in a new tab without handing the opener a reference. */
export function openSafeHttpUrl(value: string | null | undefined): boolean {
  const safe = safeHttpUrl(value);
  if (!safe || typeof window === 'undefined') return false;
  window.open(safe, '_blank', 'noopener,noreferrer');
  return true;
}
