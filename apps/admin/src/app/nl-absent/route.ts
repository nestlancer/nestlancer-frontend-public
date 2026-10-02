import { NextResponse } from 'next/server';

/**
 * Hard HTTP 404 target for probe-as-absent admin paths (NL-UI-RERUN-002 /
 * NL-BUG-ADMIN-003). Middleware rewrites known-absent segments (`/users/bulk`,
 * `/users/roles`, `/quotes/library`, non-UUID `/quotes/<junk>`, …) to
 * `/nl-absent` so the document status is 404 — App Router `notFound()` under
 * the dashboard shell soft-404s (200). Keep markup free of inline styles/scripts
 * for CSP.
 */
const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Page not found · Admin</title>
</head>
<body>
<main id="main-content">
<p>Nestlancer Admin</p>
<h1>Page not found</h1>
<p>The operator route you requested does not exist or you may not have access to it.</p>
<p><a href="/dashboard">Back to dashboard</a></p>
</main>
</body>
</html>`;

export const dynamic = 'force-dynamic';

function notFoundResponse(): NextResponse {
  return new NextResponse(NOT_FOUND_HTML, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
    },
  });
}

export function GET() {
  return notFoundResponse();
}

export function HEAD() {
  return new NextResponse(null, {
    status: 404,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
    },
  });
}
