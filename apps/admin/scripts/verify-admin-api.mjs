#!/usr/bin/env node
/**
 * Verifies all admin-app read API contracts against a live gateway.
 * Mirrors apiServices.admin / mediaAdmin / messaging GET calls used in the UI.
 *
 * Usage:
 *   API_BASE=http://127.0.0.1:3000/api/v1 node scripts/verify-admin-api.mjs
 */
const API_BASE = (process.env.API_BASE ?? 'http://127.0.0.1:3000/api/v1').replace(/\/$/, '');
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@nestlancer.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD?.trim();
if (!PASSWORD) {
  console.error('ERROR: set E2E_ADMIN_PASSWORD');
  process.exit(1);
}
const USER_ID_ENV = process.env.PIPELINE_TEST_USER_ID ?? '';
const PROJECT_ID_ENV = process.env.PIPELINE_TEST_PROJECT_ID ?? '';

const failures = [];
const passed = [];

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
    for (const key of [
      'data',
      'items',
      'users',
      'results',
      'records',
      'rows',
      'messages',
      'posts',
      'comments',
      'sessions',
      'webhooks',
      'files',
      'milestones',
      'payments',
      'projects',
      'requests',
      'quotes',
    ]) {
      if (Array.isArray(p[key])) return p[key];
    }
    // Nested envelope: { data: { data: [...], pagination } }
    if (p.data && typeof p.data === 'object' && !Array.isArray(p.data)) {
      for (const key of ['data', 'items', 'users', 'results', 'records', 'rows', 'projects']) {
        if (Array.isArray(p.data[key])) return p.data[key];
      }
    }
  }
  return [];
}

function hasRecord(payload) {
  const p = unwrap(payload);
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  if (p.id || p.email || p.title || p.name || p.status) return true;
  const nested = p.data;
  return nested && typeof nested === 'object' && !Array.isArray(nested);
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

async function request(token, method, path, { body, expectList, expectRecord, allow404 } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${path} invalid JSON: ${text.slice(0, 120)}`);
  }
  if (res.status === 404 && allow404) {
    return { skipped: true, json };
  }
  if (!res.ok) {
    const msg = unwrap(json)?.message ?? json?.message ?? text.slice(0, 200);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  const inner = unwrap(json);
  if (inner && typeof inner === 'object' && inner.statusCode >= 400) {
    throw new Error(`API error: ${JSON.stringify(inner.message ?? inner)}`);
  }
  if (inner && typeof inner === 'object' && inner.status === 'error') {
    const err = inner.error ?? inner;
    throw new Error(`API error: ${JSON.stringify(err?.message ?? err)}`);
  }
  if (expectList && pickRows(json).length === 0 && !hasRecord(json)) {
    const p = unwrap(json);
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const pg = p.pagination ?? p.meta;
      if (pg && typeof pg.total === 'number' && pg.total === 0) {
        return json;
      }
    }
  }
  if (expectRecord && !hasRecord(json)) {
    throw new Error('expected record object');
  }
  return json;
}

async function get(token, path, opts = {}) {
  return request(token, 'GET', path, opts);
}

async function check(name, fn) {
  try {
    await fn();
    passed.push(name);
    console.log(`✓ ${name}`);
  } catch (err) {
    failures.push({ name, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

/** Validates response payload shape — catches gateway routing / field regressions. */
async function checkShape(name, token, path, validate) {
  await check(name, async () => {
    const json = await get(token, path);
    validate(json);
  });
}

async function main() {
  console.log(`API_BASE=${API_BASE}`);
  const token = await login();
  console.log('✓ login\n');

  // Resolve seeded IDs from live lists when env placeholders are missing.
  let USER_ID = USER_ID_ENV;
  let PROJECT_ID = PROJECT_ID_ENV;
  if (!USER_ID || USER_ID === 'test-user-001') {
    const usersJson = await get(token, '/admin/users?page=1&limit=1');
    USER_ID = pickRows(usersJson)[0]?.id;
    if (!USER_ID) throw new Error('No admin users found to use as PIPELINE_TEST_USER_ID');
    console.log(`Resolved USER_ID=${USER_ID}`);
  }
  if (!PROJECT_ID || PROJECT_ID === 'test-project-001') {
    const projectsJson = await get(token, '/admin/projects?page=1&limit=1');
    PROJECT_ID = pickRows(projectsJson)[0]?.id;
    if (!PROJECT_ID) throw new Error('No admin projects found to use as PIPELINE_TEST_PROJECT_ID');
    console.log(`Resolved PROJECT_ID=${PROJECT_ID}`);
  }

  const listParams = '?page=1&limit=10';

  // Dashboard
  await check('dashboard/overview', () => get(token, '/admin/dashboard/overview'));
  await check('dashboard/revenue', () => get(token, '/admin/dashboard/revenue'));
  await check('dashboard/users', () => get(token, '/admin/dashboard/users'));
  await check('dashboard/projects', () => get(token, '/admin/dashboard/projects'));
  await check('dashboard/performance', () => get(token, '/admin/dashboard/performance'));
  await check('dashboard/activity', () => get(token, '/admin/dashboard/activity'));
  await check('dashboard/alerts', () => get(token, '/admin/dashboard/alerts'));
  await check('admin/health', () => get(token, '/admin/health'));

  // Contact
  await check('contact list', () => get(token, `/admin/contact${listParams}`));

  // Requests & quotes
  await check('requests list', () => get(token, `/admin/requests${listParams}`));
  await check('requests stats', () => get(token, '/admin/requests/stats'));
  await check('requests user filter', () =>
    get(token, `/admin/requests?userId=${USER_ID}&limit=50`)
  );
  await check('quotes list', () => get(token, `/admin/quotes${listParams}`));
  await check('quotes stats', () => get(token, '/admin/quotes/stats'));
  await check('quotes user filter', () => get(token, `/admin/quotes?userId=${USER_ID}&limit=50`));

  // Projects & progress
  await check('projects list', () => get(token, `/admin/projects${listParams}`));
  await check('projects stats', () => get(token, '/admin/projects/stats'));
  await check('projects client filter', () =>
    get(token, `/admin/projects?clientId=${USER_ID}&limit=50`)
  );
  await check(`project detail ${PROJECT_ID}`, () =>
    get(token, `/admin/projects/${PROJECT_ID}`, { expectRecord: true })
  );
  await check(`project deliverables ${PROJECT_ID}`, () =>
    get(token, `/admin/projects/${PROJECT_ID}/deliverables`)
  );
  await check(`progress timeline ${PROJECT_ID}`, () =>
    get(token, `/admin/progress/projects/${PROJECT_ID}/timeline`)
  );
  await check(`progress entries ${PROJECT_ID}`, () =>
    get(token, `/admin/progress/projects/${PROJECT_ID}?limit=10`)
  );

  // Payments
  await check('payments list', () => get(token, `/admin/payments${listParams}`));
  await check('payments client filter', () =>
    get(token, `/admin/payments?clientId=${USER_ID}&limit=50`)
  );
  await check('payments project filter', () =>
    get(token, `/admin/payments?projectId=${PROJECT_ID}&limit=50`)
  );
  await check('payments milestones', () => get(token, '/admin/payments/milestones'));
  await check('payments reconciliation', () => get(token, '/admin/payments/reconciliation'));

  // Messages moderation
  await check('messages flagged', () => get(token, `/admin/messages/flagged${listParams}`));
  await check('messages flagged user filter', () =>
    get(token, `/admin/messages/flagged?userId=${USER_ID}&limit=50`)
  );

  // Users
  await check('users list', () => get(token, `/admin/users${listParams}`));
  await check('users search', () => get(token, `/admin/users/search?q=test&limit=5`));
  await check(`user detail ${USER_ID}`, () =>
    get(token, `/admin/users/${USER_ID}`, { expectRecord: true })
  );
  await check(`user sessions ${USER_ID}`, () => get(token, `/admin/users/${USER_ID}/sessions`));
  await check(`user activity ${USER_ID}`, () => get(token, `/admin/users/${USER_ID}/activity`));
  await check('users logs', () => get(token, `/admin/users/logs${listParams}`));
  await check('users security-stats', () => get(token, '/admin/users/security-stats'));
  await check('impersonate sessions', () => get(token, '/admin/impersonate/sessions'));

  // CMS / blog
  await check('posts list', () => get(token, `/admin/posts?limit=20`));
  await check('comments list', () => get(token, `/admin/comments?limit=20`));
  await check('comments pending', () => get(token, '/admin/comments/pending?limit=20'));
  await check('comments reported', () => get(token, '/admin/comments/reported?limit=20'));
  await check('blog analytics', () => get(token, '/admin/blog/analytics'));
  await check('blog authors', () => get(token, '/admin/blog/authors'));

  // Portfolio
  await check('portfolio list', () => get(token, `/admin/portfolio${listParams}`));

  // Media admin
  await check('media list', () => get(token, `/admin/media${listParams}`));
  await check('media quarantine', () => get(token, '/admin/media/quarantine?limit=20'));
  await check('media analytics', () => get(token, '/admin/media/analytics'));

  // System
  await check('system config', () => get(token, '/admin/system/config'));
  await check('system features', () => get(token, '/admin/system/features'));
  await check('system jobs', () => get(token, '/admin/system/jobs'));
  await check('system email-templates', () => get(token, '/admin/system/email-templates'));
  await check('audit logs', () => get(token, `/admin/logs${listParams}`));
  await check('audit security-stats', () => get(token, '/admin/logs/security-stats'));
  await check('webhooks list', () => get(token, '/admin/webhooks'));
  await check('webhooks health', () => get(token, '/admin/webhooks/health'));
  await check('notification templates (canonical)', () =>
    get(token, '/admin/notifications/templates')
  );
  await check('notification templates (legacy)', () => get(token, '/admin/templates'));

  // Messaging (messages service prefix)
  await check('messages conversations', () => get(token, '/messages/conversations'));
  await check(`messaging project ${PROJECT_ID}`, () =>
    get(token, `/messaging/projects/${PROJECT_ID}/messages`, { allow404: true })
  );

  // Detail endpoints from first list row
  const requests = await get(token, `/admin/requests${listParams}`);
  const reqRows = pickRows(requests);
  if (reqRows[0]?.id) {
    const rid = reqRows[0].id;
    await check(`request detail ${rid}`, () =>
      get(token, `/admin/requests/${rid}`, { expectRecord: true })
    );
    await check(`request notes ${rid}`, () => get(token, `/admin/requests/${rid}/notes`));
  }

  const quotes = await get(token, `/admin/quotes${listParams}`);
  const quoteRows = pickRows(quotes);
  if (quoteRows[0]?.id) {
    const qid = quoteRows[0].id;
    await check(`quote detail ${qid}`, () =>
      get(token, `/admin/quotes/${qid}`, { expectRecord: true })
    );
  }

  const payments = await get(token, `/admin/payments${listParams}`);
  const payRows = pickRows(payments);
  if (payRows[0]?.id) {
    const pid = payRows[0].id;
    await check(`payment detail ${pid}`, () =>
      get(token, `/admin/payments/${pid}`, { expectRecord: true })
    );
  }

  const contacts = await get(token, `/admin/contact${listParams}`);
  const contactRows = pickRows(contacts);
  if (contactRows[0]?.id) {
    const cid = contactRows[0].id;
    await check(`contact detail ${cid}`, () =>
      get(token, `/admin/contact/${cid}`, { expectRecord: true })
    );
  }

  // Payload shape guards — previously broken endpoints
  console.log('\n--- Shape validation (regression guards) ---');
  await checkShape('audit logs payload', token, `/admin/logs${listParams}`, (json) => {
    const rows = pickRows(json);
    if (rows.length && !rows[0]?.action) throw new Error('rows missing action field');
  });
  await checkShape('users logs payload', token, `/admin/users/logs${listParams}`, (json) => {
    const rows = pickRows(json);
    if (rows.length && !rows[0]?.action) throw new Error('rows missing action field');
  });
  await checkShape('audit security-stats payload', token, '/admin/logs/security-stats', (json) => {
    const inner = unwrap(json);
    if (typeof inner?.totalUsers !== 'number') throw new Error('missing totalUsers');
  });
  await checkShape('blog analytics payload', token, '/admin/blog/analytics', (json) => {
    const inner = unwrap(json);
    if (typeof inner?.totalViews !== 'number') throw new Error('missing totalViews');
    if (!Array.isArray(inner?.topPosts)) throw new Error('missing topPosts array');
  });
  await checkShape('media analytics payload', token, '/admin/media/analytics', (json) => {
    const inner = unwrap(json);
    if (typeof inner?.totalCount !== 'number') throw new Error('missing totalCount');
    if (!Array.isArray(inner?.byMimeType)) throw new Error('missing byMimeType array');
  });
  await checkShape('dashboard overview payload', token, '/admin/dashboard/overview', (json) => {
    const inner = unwrap(json);
    if (!inner?.summary || typeof inner.summary.totalUsers !== 'number') {
      throw new Error('missing summary.totalUsers');
    }
  });
  await checkShape('payments list payload', token, `/admin/payments${listParams}`, (json) => {
    const rows = pickRows(json);
    const inner = unwrap(json);
    if (rows.length && !rows[0]?.id) throw new Error('payment rows missing id');
    if (inner?.meta && typeof inner.meta.total !== 'number' && rows.length) {
      throw new Error('payments meta.total missing');
    }
  });

  console.log(`\n--- Summary: ${passed.length} passed, ${failures.length} failed ---`);
  if (failures.length) {
    console.error('\nFailures:');
    for (const f of failures) console.error(`  - ${f.name}: ${f.error}`);
    process.exit(1);
  }
  console.log('\nAll admin read API checks passed.');
}

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
