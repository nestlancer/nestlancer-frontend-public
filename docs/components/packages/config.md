<div align="center">

# `@nestlancer/config`

### Typed environment validation with **Zod**, CSP helpers, and **structured server logging** for Docker.

</div>

---

## Exports

| Export                           | Purpose                                                                                                        |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `env.ts` / package root          | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `API_UPSTREAM`, proxy flags, etc.                                 |
| `features.ts`                    | Feature flag keys                                                                                              |
| `load-root-env.mjs`              | Loads repo-root `.env.development` / `.env.production` and `.env.infisical` (import in each `next.config.mjs`) |
| `csp.mjs` / `csp-middleware.mjs` | Content-Security-Policy header builder + nonce middleware                                                      |
| `correlation-id.mjs`             | Shared `X-Correlation-ID` / `X-Request-ID` + cookie helpers                                                    |
| `logger.mjs`                     | Zero-dep JSON logger → stdout/stderr (`createLogger`, `LOG_LEVEL`, redaction)                                  |
| `request-log.mjs`                | Middleware access log (`event: http.request`)                                                                  |
| `route-log.mjs`                  | Route Handler wrapper `withRouteLog` (`event: http.route`)                                                     |

Apps should import `env` from here instead of reading `process.env` directly (except `next.config.mjs`, which imports `load-root-env.mjs` first).

Env files live only at the repo root — see [environment-variables.md](../../guides/environment-variables.md).

Container logging runbook: [logging.md](../../guides/logging.md).

### Logger usage (server only)

```js
import { createLogger, resolveServiceName } from '@nestlancer/config/logger.mjs';

const log = createLogger({ service: resolveServiceName('nl-prod-frontend-web') });
log.info('frontend app starting', { event: 'app.start' });
```

```js
import { withRouteLog } from '@nestlancer/config/route-log.mjs';

export const POST = withRouteLog(handler, { service: 'nl-prod-frontend-web' });
```

Never pass tokens or passwords into log fields — `redactSecrets` censors common secret key names as a safety net.

---

## Related

- [Modification playbook](../../guides/modification-playbook.md)
- [Logging guide](../../guides/logging.md)
- [nginx guide](../../guides/nginx.md)

---

<div align="center">

**`@nestlancer/config`** — Nestlancer frontend component documentation

</div>
