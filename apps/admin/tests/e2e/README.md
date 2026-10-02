<div align="center">

# Admin testing

### Run these before merging admin or gateway changes to catch routing, payload, and UI regressions early.

</div>

---

## 📖 Table of Contents

- [Quick full check (recommended)](#quick-full-check-recommended)
- [API contract tests (no browser)](#api-contract-tests-no-browser)
- [Playwright E2E — mocked (no backend)](#playwright-e2e-mocked-no-backend)
- [Playwright E2E — live (real API + admin account)](#playwright-e2e-live-real-api-admin-account)
- [Backend unit tests (gateway proxy)](#backend-unit-tests-gateway-proxy)
- [All Playwright tests](#all-playwright-tests)

---

## Quick full check (recommended)

```bash
cd apps/admin
export API_BASE=http://127.0.0.1:3000/api/v1
export E2E_ADMIN_EMAIL=admin@nestlancer.com
export E2E_ADMIN_PASSWORD='Test1234!'
export PLAYWRIGHT_SKIP_WEBSERVER=true
export PLAYWRIGHT_ADMIN_BASE_URL=http://127.0.0.1:9010

pnpm test:api:all          # 64+ API read contracts + shape guards
pnpm type-check            # TypeScript
pnpm test:e2e tests/e2e/admin-pages.live.spec.ts \
  tests/e2e/pipeline.live.spec.ts \
  tests/e2e/admin-users.live.spec.ts   # 23 live UI smoke tests
```

---

## API contract tests (no browser)

Hits the gateway directly and validates read endpoints used by the admin UI:

```bash
cd apps/admin
export API_BASE=http://127.0.0.1:3000/api/v1
export E2E_ADMIN_EMAIL=admin@nestlancer.com
export E2E_ADMIN_PASSWORD='Test1234!'

pnpm test:api          # all admin read routes + shape guards
pnpm test:api:pipeline # pipeline hub scoped filters only
pnpm test:api:all      # pipeline + full admin suite
```

**Shape guards** validate payload fields for endpoints that previously regressed:

- `GET /admin/logs` — audit log rows with `action`
- `GET /admin/users/logs` — not misrouted as user id `logs`
- `GET /admin/blog/analytics` — `totalViews`, `topPosts`
- `GET /admin/media/analytics` — `totalCount`, `byMimeType`
- `GET /admin/dashboard/overview` — `summary.totalUsers`
- `GET /admin/payments` — `items` + `meta.total`

Scripts fail on HTTP 200 responses that wrap nested `{ status: "error" }` payloads.

---

## Playwright E2E — mocked (no backend)

Starts or reuses admin on port 9010 unless `PLAYWRIGHT_SKIP_WEBSERVER=true`:

```bash
pnpm test:e2e:mocked
```

---

## Playwright E2E — live (real API + admin account)

Admin must proxy to the gateway (`API_UPSTREAM=http://127.0.0.1:3000` in Docker dev).

```bash
export E2E_ADMIN_EMAIL=admin@nestlancer.com
export E2E_ADMIN_PASSWORD='Test1234!'
export PLAYWRIGHT_SKIP_WEBSERVER=true
export PLAYWRIGHT_ADMIN_BASE_URL=http://127.0.0.1:9010

pnpm test:e2e tests/e2e/admin-users.live.spec.ts
pnpm test:e2e tests/e2e/pipeline.live.spec.ts
pnpm test:e2e tests/e2e/admin-pages.live.spec.ts
```

Live page smoke covers all 17 nav routes:
Dashboard, Users, Requests, Quotes, Projects, Payments, Messages, Moderation, Inquiries, Analytics, Portfolio, CMS, Media, System, Webhooks, Audit Logs, Pipelines.

---

## Backend unit tests (gateway proxy)

After changing gateway path rewriting:

```bash
cd nestlancer-backend-api/gateway
npx jest tests/unit/proxy/http-proxy.service.spec.ts --testNamePattern="blog path"
```

---

## All Playwright tests

```bash
pnpm test:e2e
```
