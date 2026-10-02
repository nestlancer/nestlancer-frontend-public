import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/**
 * Deep-link alias — no API-key management exists yet (the backend exposes no
 * API-key endpoints at all), so the closest real surface is Integrations.
 *
 * Replaces the previous "Coming soon" placeholder (NL-BUG-UI-017): nothing in
 * the admin navigation links here, so the page was only ever reachable by an
 * old direct URL, and advertising an unbuilt feature to operators is worse than
 * routing them to the page that does the adjacent job. Matches the alias
 * pattern already used by /system/cache, /system/announcements and
 * /system/maintenance.
 *
 * If API keys are later built, replace this redirect with the real client.
 */
export const metadata: Metadata = { title: 'API keys' };

export default function ApiKeysAliasPage() {
  redirect('/integrations');
}
