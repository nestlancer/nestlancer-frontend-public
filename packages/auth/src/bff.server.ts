import { cookies } from 'next/headers';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './tokenManager';

/** Read HttpOnly auth cookies set by the BFF (server-only — route handlers). */
export async function readAuthCookiesFromStore(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
}
