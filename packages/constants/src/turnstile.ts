/**
 * Cloudflare Turnstile helpers.
 *
 * Enablement is driven by Infisical / env `NEXT_PUBLIC_TURNSTILE_SITE_KEY`:
 * - set → widget renders; forms must obtain a real widget token (or optional bypass)
 * - empty/missing → widget hidden; forms submit without a token (backend must also
 *   omit `TURNSTILE_SECRET_KEY` so verification is disabled)
 */

/** Public site key for Cloudflare Turnstile widget (empty when not configured). */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
}

/** True when the client should render Turnstile and require a challenge token. */
export function isTurnstileEnabled(): boolean {
  return getTurnstileSiteKey().length > 0;
}

/**
 * Resolves a Turnstile token for bot-protection endpoints.
 * Returns empty string when Turnstile is disabled (no site key).
 */
export function resolveTurnstileToken(widgetToken?: string | null): string {
  if (!isTurnstileEnabled()) {
    return '';
  }

  const fromWidget = widgetToken?.trim();
  if (fromWidget) return fromWidget;

  if (process.env.NODE_ENV !== 'production') {
    const fromEnv = process.env.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN?.trim();
    if (fromEnv) return fromEnv;
    return 'dev-bypass-token';
  }

  throw new Error('Security verification is required. Retry the check, then try again.');
}
