import { resolvePublicApiUrl } from '@nestlancer/config';
import { NextResponse } from 'next/server';

const apiBase = resolvePublicApiUrl();

/** Redirect syndication consumers to the gateway Atom feed. */
export function GET() {
  return NextResponse.redirect(`${apiBase}/api/v1/blog/feed/atom`, 307);
}
