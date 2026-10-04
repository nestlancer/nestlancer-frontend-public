# Command reference

Root `pnpm` scripts from `package.json`, verified 2026-10-03. Prefer these over raw
`./scripts/...` when a package script exists.

## Core

| Command           | Purpose                              |
| :---------------- | :----------------------------------- |
| `pnpm dev`        | Turborepo dev for all apps           |
| `pnpm build`      | Production build                     |
| `pnpm lint`       | ESLint across workspaces             |
| `pnpm format`     | Prettier write                       |
| `pnpm type-check` | TypeScript check                     |
| `pnpm test`       | Unit/package tests                   |
| `pnpm test:e2e`   | E2E tests                            |
| `pnpm clean`      | Clean turbo outputs + `node_modules` |

## OpenAPI / contract

| Command                    | Purpose                                   |
| :------------------------- | :---------------------------------------- |
| `pnpm pull:openapi`        | Pull gateway OpenAPI into `swagger-docs/` |
| `pnpm codegen`             | Orval generate + post-process             |
| `pnpm codegen:check`       | Regenerate and fail on drift              |
| `pnpm openapi:lint`        | Spectral lint                             |
| `pnpm openapi:refresh`     | Pull + codegen                            |
| `pnpm api:drift-check:all` | Service drift helpers                     |
| `pnpm contract:check`      | `codegen:check` + `openapi:lint`          |

## Docker (dev)

| Command                                                                              | Purpose           |
| :----------------------------------------------------------------------------------- | :---------------- |
| `pnpm docker:build` / `docker:build:nocache`                                         | Build dev images  |
| `pnpm docker:up` / `docker:down` / `docker:ps` / `docker:restart`                    | Compose lifecycle |
| `pnpm docker:logs` / `docker:logs:web` / `docker:logs:admin` / `docker:logs:landing` | Logs              |
| `pnpm docker:proxy:logs`                                                             | Dev proxy logs    |
| `pnpm docker:verify:dev-host`                                                        | Dev host checks   |
| `pnpm docker:start`                                                                  | Build + up        |

## Docker (prod)

| Command                                                 | Purpose                                       |
| :------------------------------------------------------ | :-------------------------------------------- |
| `pnpm docker:prod:generate`                             | Generate prod Compose from workloads manifest |
| `pnpm docker:prod:build` / `build:one` / `build:group`  | GHCR-oriented image builds                    |
| `pnpm docker:prod:pull` / `up` / `down` / `ps` / `logs` | Prod Compose                                  |
| `pnpm docker:prod:run` / `start`                        | Up / build+up                                 |
| `pnpm docker:prod:smoke`                                | Smoke health                                  |
| `pnpm docker:prod:local:*`                              | Local prod Compose helpers                    |

## K3s

| Command               | Purpose                |
| :-------------------- | :--------------------- |
| `pnpm k3s:generate`   | Generate K3s manifests |
| `pnpm k3s:validate`   | Validate manifests     |
| `pnpm k3s:local:test` | Local K3s test helper  |

## Docs

| Command                | Purpose                                            |
| :--------------------- | :------------------------------------------------- |
| `pnpm docs:changelog`  | Regenerate root + `docs/changelog/CHANGELOG.md`    |
| `pnpm docs:components` | Regenerate `docs/components/**` from apps/packages |

See also [`scripts.md`](scripts.md) and [`../operations/`](../operations/README.md).
