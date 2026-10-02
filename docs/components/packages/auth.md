<div align="center">

# @nestlancer/auth

### Session provider, token refresh, and route protection helpers.

</div>

---

## 📖 Table of Contents

- [Package info](#package-info)
- [Workspace dependencies](#workspace-dependencies)
- [Exports](#exports)
- [Security](#security)
- [Used in](#used-in)
- [📚 Related documentation](#related-documentation)

---

## Package info

|            |                                         |
| :--------- | :-------------------------------------- |
| **Path**   | `packages/auth/`                        |
| **Import** | `import { … } from '@nestlancer/auth';` |

---

## Workspace dependencies

- `@nestlancer/types`

---

## Exports

- `AuthProvider` — wraps apps; hydrates user from `/api/v1/users/me` or cookie session
- `useAuth()` — current user, login/logout
- Middleware helpers for Next.js edge
- Same-origin auth BFF helpers (`postGatewayLogin`, cookie apply/clear, refresh proxy)
- `logAuthEvent()` — structured domain logs for BFF outcomes (`auth.login`, `auth.refresh`, …) via `@nestlancer/config/logger.mjs` — **never** pass tokens/passwords

---

## Security

- Prefers **HttpOnly** cookies set by gateway on login
- Does not store access tokens in `localStorage`
- Coordinates refresh via same-origin `/api/auth/refresh` (BFF) when `NEXT_PUBLIC_AUTH_REFRESH_BFF=true`
- Auth route handlers wrapped with `withRouteLog` so status/latency appear in container logs

---

## Used in

`apps/web`, `apps/admin` — see `features/auth/` for forms and `app/api/auth/*` for BFF routes.

---

## 📚 Related documentation

- [Frontend architecture](../../architecture/ARCHITECTURE.md)
- [Container logging](../../guides/logging.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)

---

<div align="center">

**@nestlancer/auth** — Nestlancer frontend component documentation

</div>
