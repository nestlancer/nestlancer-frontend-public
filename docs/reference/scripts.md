# Scripts catalog

Summary of [`scripts/`](../../scripts/README.md). Safety classes: **safe/local**, **infra**,
**destructive**.

| Path                                      | Class               | Purpose                                 | Callers                           |
| :---------------------------------------- | :------------------ | :-------------------------------------- | :-------------------------------- |
| `scripts/docs/generate-changelog.mjs`     | safe                | Changelog from git history              | `pnpm docs:changelog`             |
| `scripts/docs/generate-frontend-docs.mjs` | safe                | App/package component docs              | `pnpm docs:components`            |
| `scripts/openapi/*`                       | safe / infra        | Pull OpenAPI, Orval post-process, drift | `pnpm pull:openapi`, `codegen`, … |
| `scripts/docker/*`                        | infra               | Compose + image build helpers           | `pnpm docker:*`, `docker:prod:*`  |
| `scripts/deploy/*`                        | infra / destructive | K3s, rollback, smoke                    | `pnpm k3s:*`, `docker:prod:smoke` |
| `scripts/infisical/*`                     | safe / infra        | Export verification                     | manual / CI                       |

Prefer package scripts. Shell scripts used as `./scripts/...` in CI must stay executable.
