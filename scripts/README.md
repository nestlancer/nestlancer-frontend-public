# Scripts

Operational and generation helpers for the Nestlancer frontend monorepo.

| Directory                  | Purpose                                                     | Typical callers                                                 |
| :------------------------- | :---------------------------------------------------------- | :-------------------------------------------------------------- |
| [`docs/`](docs/)           | Changelog + component-doc generators                        | `pnpm docs:changelog`, `pnpm docs:components`                   |
| [`openapi/`](openapi/)     | Pull gateway OpenAPI, Orval post-process, drift-check       | `pnpm pull:openapi`, `pnpm codegen`, `pnpm api:drift-check:all` |
| [`docker/`](docker/)       | Dev/prod Compose wrappers, image builds, workloads manifest | `pnpm docker:*`, `pnpm docker:prod:*`                           |
| [`deploy/`](deploy/)       | K3s generate/validate/deploy, rollback, smoke               | `pnpm k3s:*`, `pnpm docker:prod:smoke`                          |
| [`infisical/`](infisical/) | Infisical export verification                               | manual / CI                                                     |

## Safety

| Class            | Meaning                                                |
| :--------------- | :----------------------------------------------------- |
| **safe / local** | Read-only or local generate (docs, openapi normalize)  |
| **infra**        | Touches Docker/K3s/remote hosts — review env first     |
| **destructive**  | Rollback / down / prune-class actions — confirm target |

Prefer `pnpm <script>` over raw `./scripts/...` when a package script exists. Shell scripts invoked as `./scripts/...` in CI must remain executable (`chmod +x`).

## Docs generators

```bash
pnpm docs:changelog    # → CHANGELOG.md + docs/changelog/CHANGELOG.md
pnpm docs:components   # → docs/components/apps/* + packages/* (respects manual skip list)
```
