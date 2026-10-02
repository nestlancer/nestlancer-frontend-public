# Frontend container logging

Server-side structured logs for Docker / Compose. **Not** the browser DevTools console.

## Design

- JSON **one object per line** on stdout/stderr (12-factor; Docker `json-file` / Promtail collect it)
- Shared logger: [`packages/config/logger.mjs`](../../packages/config/logger.mjs)
- Access lines: middleware [`request-log.mjs`](../../packages/config/request-log.mjs) → `event: http.request`
- Route handlers: [`route-log.mjs`](../../packages/config/route-log.mjs) `withRouteLog` → `event: http.route`
- Auth BFF domain events: `logAuthEvent` in `@nestlancer/auth` → `auth.login`, `auth.refresh`, …
- Startup: `apps/*/src/instrumentation.ts` → `event: app.start` (needs `experimental.instrumentationHook: true`)

Do **not** add Pino for this stack — the zero-dep logger matches backend-aligned JSON and avoids standalone `thread-stream` packaging issues.

## Environment

| Variable             | Where                         | Meaning                                                               |
| :------------------- | :---------------------------- | :-------------------------------------------------------------------- |
| `LOG_LEVEL`          | Infisical + compose           | `debug` \| `info` \| `warn` \| `error` (default `info` in production) |
| `NESTLANCER_SERVICE` | Compose runtime (per service) | Log `service` field (`nl-prod-frontend-web` / `admin` / `landing`)    |

Infisical: `dev` → `LOG_LEVEL=debug`; `prod` → `LOG_LEVEL=info`. See [environment-variables.md](./environment-variables.md) and [infisical.md](./infisical.md).

## View logs with pnpm

### Production Compose (`nl-prod-frontend-*`, ports 9100/9110/9120)

```bash
# All apps (follow, last 100 lines)
pnpm docker:prod:logs

# One app
pnpm docker:prod:logs -- web
pnpm docker:prod:logs -- admin
pnpm docker:prod:logs -- landing

# Filter structured events
pnpm docker:prod:logs -- web 2>&1 | grep -E 'app\.start|auth\.|http\.(request|route)'
```

### Development Compose (ports 9000/9010/9020)

```bash
pnpm docker:logs
pnpm docker:logs:web
pnpm docker:logs:admin
pnpm docker:logs:landing
```

### Direct Docker (same containers)

```bash
docker logs -f --tail=100 nl-prod-frontend-web
docker logs -f --tail=100 nl-prod-frontend-admin
docker logs -f --tail=100 nl-prod-frontend-landing
```

## Log shape (examples)

Startup:

```json
{
  "level": "info",
  "message": "frontend app starting",
  "timestamp": "...",
  "service": "nl-prod-frontend-web",
  "event": "app.start",
  "nodeEnv": "production",
  "logLevel": "info"
}
```

Middleware access:

```json
{
  "level": "info",
  "message": "GET / 200 1ms",
  "service": "nl-prod-frontend-web",
  "event": "http.request",
  "correlationId": "...",
  "method": "GET",
  "path": "/",
  "status": 200,
  "durationMs": 1
}
```

Auth BFF (no tokens/passwords):

```json
{
  "level": "info",
  "message": "auth.refresh no_session",
  "service": "nl-prod-frontend-web",
  "event": "auth.refresh",
  "outcome": "no_session",
  "portal": "client",
  "correlationId": "..."
}
```

Route wrapper (handler duration):

```json
{
  "level": "info",
  "message": "POST /api/auth/refresh 204 15ms",
  "service": "nl-prod-frontend-web",
  "event": "http.route",
  "method": "POST",
  "path": "/api/auth/refresh",
  "status": 204,
  "durationMs": 15,
  "correlationId": "..."
}
```

Correlation: `X-Correlation-ID` / `X-Request-ID` (and cookie `nl_correlation_id` on app/admin). Grep one id across middleware + route + auth lines.

**Middleware vs BFF/gateway:** Middleware still stamps correlation headers on every matched request, but it does **not** emit `http.request` for `/api/auth/*` or `/api/v1/*`. Those paths are logged by `withRouteLog` (BFF) or the API gateway — avoiding a fake middleware `200` that disagreed with the real handler status (e.g. refresh `204`).

## What is not logged here

- Client Components `console.*` → browser only
- Product telemetry stubs (`trackEvent`) → not shipped to containers
- Request/response bodies (tokens, passwords) — redacted if accidentally passed to the logger

## Related

- [environment-variables.md](./environment-variables.md)
- [infisical.md](./infisical.md)
- [prod-deployment.md](./prod-deployment.md)
- [troubleshooting.md](./troubleshooting.md)
- [`@nestlancer/config`](../components/packages/config.md)
