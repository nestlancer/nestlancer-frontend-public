<div align="center">

# Full-stack onboarding (frontend focus)

### Get the Nestlancer UI running and aligned with the API gateway.

</div>

---

## 📖 Table of Contents

- [Repositories](#repositories)
- [Day 1 setup](#day-1-setup)
- [Read next (order)](#read-next-order)
- [App map](#app-map)
- [Feature module convention](#feature-module-convention)
- [Regenerate docs](#regenerate-docs)
- [Backend onboarding](#backend-onboarding)

---

## Repositories

| Repo                              | Purpose                        |
| :-------------------------------- | :----------------------------- |
| `nestlancer-frontend` (this repo) | Next.js apps + shared packages |
| `nestlancer-backend-api`          | API gateway and microservices  |

You need **both** for end-to-end features.

---

## Day 1 setup

### 1. Prerequisites

Node 20+, pnpm 9+, Docker (recommended for dev behind nginx).

### 2. Install

```bash
git clone <frontend-repo-url> nestlancer-frontend
cd nestlancer-frontend
pnpm install   # installs Husky hooks
```

### 3. Environment

Edit root `.env.development`:

```env
# Example: local gateway
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Or dev server with proxy (see README.md)
```

### 4. Start backend first

```bash
cd ../nestlancer-backend-api
make dev-services && make db-migrate && make db-seed
pnpm --filter @nestlancer/gateway dev
```

### 5. Start frontend

```bash
cd ../nestlancer-frontend
pnpm docker:start
# web → http://localhost:9000
# admin → http://localhost:9010
```

Or host-only:

```bash
pnpm --filter @nestlancer/web dev
```

### 6. OpenAPI client

```bash
pnpm pull:openapi
pnpm codegen
```

Runs automatically on `pre-push` via `contract:check`.

---

## Read next (order)

1. [docs/README.md](../README.md)
2. [architecture/overview.md](../architecture/overview.md) — RSC, Query, auth
3. [modification-playbook.md](./modification-playbook.md)
4. [components/apps/web.md](../components/apps/web.md) or [admin.md](../components/apps/admin.md)
5. Wireframes for UX: [diagrams/wireframes/](../architecture/diagrams/wireframes/README.md)

---

## App map

| App     | Port | Audience           |
| :------ | :--- | :----------------- |
| web     | 9000 | Clients (`USER`)   |
| admin   | 9010 | Operator (`ADMIN`) |
| landing | 9020 | Marketing          |

---

## Feature module convention

```
apps/web/src/features/<domain>/
  components/   # UI
  hooks/        # TanStack Query + API
  *Client.tsx   # page shells
```

Shared code lives in `packages/*` — see [components/packages/](../components/packages/).

---

## Regenerate docs

```bash
node scripts/docs/generate-frontend-docs.mjs
node scripts/docs/generate-changelog.mjs
```

---

## Backend onboarding

[nestlancer-backend-api/docs/development/setup.md](../../../nestlancer-backend-api/docs/development/setup.md)

---

<div align="center">

**Full-stack onboarding (frontend focus)** — Nestlancer guide

</div>
