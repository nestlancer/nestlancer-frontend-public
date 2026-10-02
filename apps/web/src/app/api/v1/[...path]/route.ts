import { proxyApiV1 } from '@nestlancer/config/proxy-api-v1.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: { path?: string[] } };

async function handle(request: Request, context: RouteContext) {
  return proxyApiV1(request, context.params.path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
