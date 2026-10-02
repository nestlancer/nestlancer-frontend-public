<div align="center">

# Frontend modification playbook

### How to change the Nestlancer UI monorepo without breaking auth, contracts, or shared packages.

</div>

---

## 📖 Table of Contents

- [Decision tree](#decision-tree)
- [App selection](#app-selection)
- [Standard flow: ship a feature against existing API](#standard-flow-ship-a-feature-against-existing-api)
- [Environment checklist](#environment-checklist)
- [Feature → backend map](#feature-backend-map)
- [Husky / CI](#husky-ci)
- [Related](#related)

---

## Decision tree

| You need to…            | Where to work                        | Also do                                                                                       |
| :---------------------- | :----------------------------------- | :-------------------------------------------------------------------------------------------- |
| New page / route        | `apps/<app>/src/app/.../page.tsx`    | Middleware, constants routes, wireframe doc                                                   |
| New UI for existing API | `apps/<app>/src/features/<domain>/`  | Query keys, Orval or hand service                                                             |
| New API consumer        | `packages/api-client` + feature hook | `pnpm pull:openapi && pnpm codegen`                                                           |
| Shared button / form    | `packages/ui`                        | Storybook if applicable                                                                       |
| Auth-gated area         | `middleware.ts`, `@nestlancer/auth`  | Match backend role                                                                            |
| Realtime                | `packages/websocket` + feature hook  | [WebSocket protocol](../../../nestlancer-backend-api/docs/architecture/websocket-protocol.md) |
| Pay checkout            | `features/payments/`                 | [razorpay-test-payments.md](./razorpay-test-payments.md)                                      |

---

## App selection

| App            | Package               | Port | Users   |
| :------------- | :-------------------- | :--- | :------ |
| Client product | `@nestlancer/web`     | 9000 | `USER`  |
| Operator       | `@nestlancer/admin`   | 9010 | `ADMIN` |
| Marketing      | `@nestlancer/landing` | 9020 | Public  |

Deep docs: [web](../components/apps/web.md), [admin](../components/apps/admin.md), [landing](../components/apps/landing.md).

---

## Standard flow: ship a feature against existing API

### 1. Refresh contract

```bash
# Gateway must be running or use dev.nestlancer.com
pnpm pull:openapi
pnpm codegen
pnpm contract:check   # runs on pre-push
```

Generated code: `packages/api-client/src/generated/` — **do not edit**.

### 2. Feature module (web example)

```
apps/web/src/features/<domain>/
├── components/       # Presentational + containers
├── hooks/            # useQuery / useMutation wrappers
├── index.ts          # Public exports
└── *Client.tsx       # Page-level client components used by app router
```

Patterns:

- **Server Component page** fetches static/SEO data; pass to client child.
- **Client Component** uses TanStack Query with keys from `@nestlancer/constants` or local `queryKeys.ts`.
- Forms: React Hook Form + schema from `@nestlancer/validators`.

### 3. Wire route

Add `apps/web/src/app/(dashboard)/<path>/page.tsx` (or `(public)` / `(auth)`).

Update `middleware.ts` if the path needs auth or role checks.

### 4. API calls

Prefer thin hooks:

```typescript
// features/foo/hooks/useFooList.ts
import { useQuery } from '@tanstack/react-query';
import { fooService } from '@nestlancer/api-client';

export function useFooList() {
  return useQuery({
    queryKey: ['foo', 'list'],
    queryFn: () => fooService.list(),
  });
}
```

Use generated React Query hooks where available (blog pilot under `generated/react-query/`).

### 5. Styling

- Use `@nestlancer/ui` primitives and Tailwind tokens from `@nestlancer/tokens`.
- Dashboard layout: existing sidebar in `components/layout/`.
- Match [wireframes](../architecture/diagrams/wireframes/) when changing UX.

### 6. Test

```bash
pnpm --filter @nestlancer/web test          # Vitest
pnpm --filter @nestlancer/web test:e2e      # Playwright
```

E2E env: see `apps/web/tests/e2e/README.md`.

---

## Environment checklist

| Variable                                 | Purpose                        |
| :--------------------------------------- | :----------------------------- |
| `NEXT_PUBLIC_API_URL`                    | API origin for browser         |
| `NEXT_PUBLIC_API_PROXY` + `API_UPSTREAM` | Same-origin proxy through Next |
| `NEXT_PUBLIC_WS_URL`                     | Socket.IO                      |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`         | Register/login/contact         |

File: repo root `.env.development` — [nginx](./nginx.md) for subdomain setup.

---

## Feature → backend map

| Frontend `features/`  | Backend service             | Gateway prefix                         |
| :-------------------- | :-------------------------- | :------------------------------------- |
| `auth`                | auth                        | `/api/v1/auth`                         |
| `profile`, `settings` | users                       | `/api/v1/users`                        |
| `requests`            | requests                    | `/api/v1/requests`                     |
| `quotes`              | quotes                      | `/api/v1/quotes`                       |
| `projects`, `work`    | projects, progress          | `/api/v1/projects`, `/api/v1/progress` |
| `payments`            | payments                    | `/api/v1/payments`                     |
| `messaging`           | messaging + ws-gateway      | `/api/v1/messaging`                    |
| `notifications`       | notifications               | `/api/v1/notifications`                |
| `media`               | media                       | `/api/v1/media`                        |
| `blog`                | blog                        | `/api/v1/blog`                         |
| `portfolio`           | portfolio                   | `/api/v1/portfolio`                    |
| `contact`             | contact                     | `/api/v1/contact`                      |
| admin features        | admin + domain admin routes | `/api/v1/admin`                        |

Backend playbook: [nestlancer-backend-api/docs/guides/modification-playbook.md](../../../nestlancer-backend-api/docs/guides/modification-playbook.md).

---

## Husky / CI

- **pre-commit:** lint-staged on staged TS/TSX
- **pre-push:** `pnpm contract:check` (~3–4 min) — plan accordingly
- Commits: `type(scope): subject` — scopes in `commitlint.config.js`

---

## Related

- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md)
- [dir-structure.md](../architecture/dir-structure.md)
- [api-client](../components/packages/api-client.md)
- [CHANGELOG](../changelog/CHANGELOG.md)

---

<div align="center">

**Frontend modification playbook** — Nestlancer guide

</div>
