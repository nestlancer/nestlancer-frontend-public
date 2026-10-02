#!/usr/bin/env node
/**
 * Verifies pipeline hub incoming/outgoing API contracts against a live gateway.
 * Usage:
 *   API_BASE=http://127.0.0.1:3000/api/v1 node scripts/verify-pipeline-api.mjs
 */
const API_BASE = (process.env.API_BASE ?? 'http://127.0.0.1:3000/api/v1').replace(/\/$/, '');
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@nestlancer.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD?.trim();
if (!PASSWORD) {
  console.error('ERROR: set E2E_ADMIN_PASSWORD');
  process.exit(1);
}
const USER_ID_ENV = process.env.PIPELINE_TEST_USER_ID ?? '';

function unwrap(json) {
  if (json && typeof json === 'object' && 'data' in json && json.data !== null) {
    return json.data;
  }
  return json;
}

function pickRows(payload) {
  const p = unwrap(payload);
  if (Array.isArray(p)) return p;
  if (p && typeof p === 'object') {
    for (const key of ['data', 'items', 'users', 'results', 'records', 'rows', 'messages']) {
      if (Array.isArray(p[key])) return p[key];
    }
  }
  return [];
}

function pickPagination(payload) {
  const p = unwrap(payload);
  if (!p || typeof p !== 'object') return null;
  const pg = p.pagination ?? p.meta;
  if (!pg || typeof pg !== 'object') return null;
  const total = pg.total ?? pg.totalItems;
  if (typeof total !== 'number') return null;
  return { total, page: pg.page, limit: pg.limit ?? pg.pageSize };
}

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login HTTP ${res.status}`);
  const json = await res.json();
  const token = unwrap(json)?.accessToken ?? json.accessToken;
  if (!token) throw new Error('login missing accessToken');
  return token;
}

async function get(token, path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${path} invalid JSON: ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    throw new Error(`${path} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const inner = unwrap(json);
  if (inner && typeof inner === 'object' && inner.statusCode >= 400) {
    throw new Error(`${path} API error: ${JSON.stringify(inner.message ?? inner)}`);
  }
  if (inner && typeof inner === 'object' && inner.status === 'error') {
    const err = inner.error ?? inner;
    throw new Error(`${path} API error: ${JSON.stringify(err?.message ?? err)}`);
  }
  return json;
}

function assertUserScoped(rows, label, expectedUserId) {
  for (const row of rows) {
    const uid =
      row.userId ??
      row.clientId ??
      row.user?.id ??
      row.client?.id;
    if (uid && uid !== expectedUserId) {
      throw new Error(`${label}: row ${row.id} belongs to ${uid}, expected ${expectedUserId}`);
    }
  }
}

async function main() {
  console.log(`API_BASE=${API_BASE}`);
  const token = await login();
  console.log('✓ login');

  let USER_ID = USER_ID_ENV;
  if (!USER_ID || USER_ID === 'test-user-001') {
    const users = await get(token, '/admin/users?page=1&limit=1');
    USER_ID = pickRows(users)[0]?.id;
    if (!USER_ID) throw new Error('No admin users found to use as PIPELINE_TEST_USER_ID');
  }
  console.log(`USER_ID=${USER_ID}`);

  const requests = await get(token, `/admin/requests?userId=${USER_ID}&limit=50`);
  const requestRows = pickRows(requests);
  assertUserScoped(requestRows, 'requests', USER_ID);
  console.log(`✓ requests filter (${requestRows.length} rows, total ${pickPagination(requests)?.total ?? '?'})`);

  const quotes = await get(token, `/admin/quotes?userId=${USER_ID}&limit=50`);
  const quoteRows = pickRows(quotes);
  assertUserScoped(quoteRows, 'quotes', USER_ID);
  console.log(`✓ quotes filter (${quoteRows.length} rows)`);

  const projects = await get(token, `/admin/projects?clientId=${USER_ID}&limit=50`);
  const projectRows = pickRows(projects);
  assertUserScoped(projectRows, 'projects', USER_ID);
  const projectId = projectRows[0]?.id;
  console.log(`✓ projects filter (${projectRows.length} rows)`);

  const payments = await get(token, `/admin/payments?clientId=${USER_ID}&limit=50`);
  const paymentRows = pickRows(payments);
  assertUserScoped(paymentRows, 'payments', USER_ID);
  console.log(`✓ payments clientId filter (${paymentRows.length} rows)`);

  if (projectId) {
    const projectPayments = await get(token, `/admin/payments?projectId=${projectId}&limit=50`);
    const ppRows = pickRows(projectPayments);
    for (const row of ppRows) {
      if (row.projectId && row.projectId !== projectId) {
        throw new Error(`project payments: row ${row.id} has projectId ${row.projectId}`);
      }
    }
    console.log(`✓ payments projectId filter (${ppRows.length} rows for ${projectId})`);

    await get(token, `/admin/projects/${projectId}`);
    console.log(`✓ project detail ${projectId}`);

    await get(token, `/admin/progress/projects/${projectId}/timeline`);
    console.log(`✓ project timeline ${projectId}`);

    await get(token, `/admin/projects/${projectId}/deliverables`);
    console.log(`✓ project deliverables ${projectId}`);
  }

  const flagged = await get(token, `/admin/messages/flagged?userId=${USER_ID}&limit=50`);
  const flaggedRows = pickRows(flagged);
  console.log(`✓ flagged messages user filter (${flaggedRows.length} rows)`);

  await get(token, `/admin/users/${USER_ID}`);
  console.log(`✓ user profile ${USER_ID}`);

  await get(token, `/admin/users/${USER_ID}/sessions`);
  console.log(`✓ user sessions ${USER_ID}`);

  await get(token, `/admin/users/${USER_ID}/activity`);
  console.log(`✓ user activity ${USER_ID}`);

  console.log('\nAll pipeline hub API checks passed.');
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
