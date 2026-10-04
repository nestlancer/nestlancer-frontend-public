<div align="center">

# Nestlancer Frontend — Documentation

### Next.js 14 monorepo: **web** (9000), **admin** (9010), **landing** (9020), plus 15 shared packages.

</div>

---

## Start here

| Document                                                             | Description                                |
| :------------------------------------------------------------------- | :----------------------------------------- |
| [Setup](development/setup.md)                                        | Day 1 setup with backend + frontend        |
| [Modification playbook](development/modification-playbook.md)        | Routes, features, Orval, testing           |
| [Architecture overview](architecture/overview.md)                    | Stack, auth, data fetching, realtime       |
| [Directory structure](architecture/dir-structure.md)                 | Monorepo layout (apps + packages)          |
| [Root README](../README.md)                                          | Quick start, ports, Husky, OpenAPI codegen |
| [Production deploy (Compose)](operations/deployment-prod-compose.md) | GHCR, Compose, image build commands        |
| [Contributing](../CONTRIBUTING.md) · [Security](../SECURITY.md)      | Contribution and security standards        |

---

## Applications (3)

| App                          | Port | Doc                                                      |
| :--------------------------- | ---: | :------------------------------------------------------- |
| **web** — client product UI  | 9000 | [components/apps/web.md](components/apps/web.md)         |
| **admin** — operator console | 9010 | [components/apps/admin.md](components/apps/admin.md)     |
| **landing** — marketing site | 9020 | [components/apps/landing.md](components/apps/landing.md) |

---

## Shared packages (15)

See [components/packages/](components/packages/README.md) for the full list (`api-client`, `ui`, `auth`, `websocket`, …).

---

## Documentation map

| Category     | Path                                      | Contents                                         |
| :----------- | :---------------------------------------- | :----------------------------------------------- |
| Architecture | [`architecture/`](architecture/README.md) | Overview, dir-structure, wireframe diagrams      |
| API contract | [`api/`](api/README.md)                   | OpenAPI pull, Orval, drift-check                 |
| Components   | [`components/`](components/README.md)     | Apps + packages                                  |
| Development  | [`development/`](development/README.md)   | Setup, playbook, troubleshooting                 |
| Operations   | [`operations/`](operations/README.md)     | Deploy, Infisical, K3s, nginx, logging, payments |
| Reference    | [`reference/`](reference/README.md)       | Commands, scripts, env vars, repo structure      |
| Changelog    | [`changelog/`](changelog/README.md)       | Generated history (`pnpm docs:changelog`)        |

---

## Maintaining docs

| Task                         | Command                |
| :--------------------------- | :--------------------- |
| Regenerate app/package pages | `pnpm docs:components` |
| Regenerate changelog         | `pnpm docs:changelog`  |

Script catalog: [`scripts/README.md`](../scripts/README.md).

---

## Backend counterpart

Sibling repo: [`nestlancer-backend-api`](../../nestlancer-backend-api/docs/README.md).

| Topic                 | Backend path                                                                                                      |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------- |
| Setup / onboarding    | [`docs/development/setup.md`](../../nestlancer-backend-api/docs/development/setup.md)                             |
| Environment variables | [`docs/reference/environment-variables.md`](../../nestlancer-backend-api/docs/reference/environment-variables.md) |
| Infisical             | [`docs/operations/secrets-infisical.md`](../../nestlancer-backend-api/docs/operations/secrets-infisical.md)       |
| Troubleshooting       | [`docs/development/troubleshooting.md`](../../nestlancer-backend-api/docs/development/troubleshooting.md)         |
