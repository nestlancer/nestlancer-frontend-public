import { getSiteOrigin } from './site-origin';

/** Base URL of the main web app (client portal + public content). */
export function webAppUrl(path = ''): string {
  const base = getSiteOrigin();
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
