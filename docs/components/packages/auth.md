# @nestlancer/auth

Session provider, token refresh, and route protection helpers.

## Package info

|            |                                         |
| ---------- | --------------------------------------- |
| **Path**   | `packages/auth/`                        |
| **Import** | `import { … } from '@nestlancer/auth';` |

## Workspace dependencies

- `@nestlancer/config`
- `@nestlancer/types`

## Exports

- `AuthProvider` — wraps apps; hydrates user from `/api/v1/users/me` or cookie session
- `useAuth()` — current user, login/logout
- Middleware helpers for Next.js edge

## Security

- Prefers **HttpOnly** cookies set by gateway on login
- Does not store access tokens in `localStorage`
- Coordinates refresh via `/api/v1/auth/refresh`

## Used in

`apps/web`, `apps/admin` — see `features/auth/` for forms.

## Related documentation

- [Frontend architecture](../../architecture/overview.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)
