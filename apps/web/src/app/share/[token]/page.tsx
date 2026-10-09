import type { Metadata } from 'next';
import { cache } from 'react';

import { PublicShareError, resolvePublicShare } from '@nestlancer/api-client';
import { resolvePublicApiUrl } from '@nestlancer/config';

import { buildPageMetadata } from '@/lib/seo';

import { PublicShareClient, type PublicShareInitial } from './PublicShareClient';

export const dynamic = 'force-dynamic';

type Props = { params: { token: string } };

function isPasswordRequiredError(err: unknown): boolean {
  if (err instanceof PublicShareError) {
    if (err.status === 401 || err.status === 403) return true;
    return err.message.toLowerCase().includes('password');
  }
  return false;
}

const loadShare = cache(async (token: string): Promise<PublicShareInitial> => {
  if (!token) {
    return { kind: 'error', message: 'This share link is invalid or has expired.' };
  }
  try {
    const data = await resolvePublicShare(token, { apiOrigin: resolvePublicApiUrl() });
    return { kind: 'ok', data };
  } catch (err) {
    if (isPasswordRequiredError(err)) {
      return { kind: 'password' };
    }
    const message =
      err instanceof PublicShareError ? err.message : 'This share link is invalid or has expired.';
    return { kind: 'error', message };
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const initial = await loadShare(params.token);
  if (initial.kind === 'error') {
    return buildPageMetadata({
      title: 'Share link unavailable',
      description: 'This share link is invalid or has expired.',
      path: `/share/${params.token}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: 'Shared deliverable',
    description: 'A file shared with you on Nestlancer.',
    path: `/share/${params.token}`,
    noIndex: true,
  });
}

export default async function PublicSharePage({ params }: Props) {
  const token = String(params.token ?? '');
  const initial = await loadShare(token);
  return <PublicShareClient token={token} initial={initial} />;
}
