# Repository structure

Verified against the tree on 2026-10-03 — re-check before quoting counts elsewhere.

## Top level

```text
.
├── apps/
│   ├── web/              Client portal + public blog/portfolio (port 9000)
│   ├── admin/            Operations console (port 9010)
│   └── landing/          Marketing site (port 9020)
├── packages/             15 shared @nestlancer/* libraries
├── scripts/              Repo automation — see scripts/README.md
│   ├── docs/             Changelog + component-doc generators
│   ├── openapi/          OpenAPI pull / Orval / drift-check
│   ├── docker/           Compose + image helpers + workloads.manifest.json
│   ├── deploy/           K3s, rollback, smoke
│   └── infisical/        Export verification
├── swagger-docs/         Mirrored gateway OpenAPI (not hand-owned SoT)
├── docs/                 Documentation tree (this folder's parent)
├── deploy/               Deploy notes / assets
├── docker-compose*.yml   Dev / local / prod Compose entrypoints
├── .github/workflows/    CI/CD
└── .husky/               Git hooks
```

Workspace packages: `pnpm-workspace.yaml` → `apps/*`, `packages/*`.

## Apps (3)

| App     | Package path   | Dev port |
| :------ | :------------- | -------: |
| web     | `apps/web`     |     9000 |
| admin   | `apps/admin`   |     9010 |
| landing | `apps/landing` |     9020 |

Docs: [`docs/components/apps/`](../components/apps/README.md).

## Packages (15)

`api-client`, `auth`, `config`, `constants`, `field-help`, `hooks`, `marketing`, `motion`,
`theme`, `tokens`, `types`, `ui`, `utils`, `validators`, `websocket`.

Docs: [`docs/components/packages/`](../components/packages/README.md).

## Generated (do not hand-edit)

- `packages/api-client/src/generated/**` — Orval (`pnpm codegen`)
- Prod Compose / K3s outputs when produced by `pnpm docker:prod:generate` / `pnpm k3s:generate`

## Documentation taxonomy

```text
docs/
├── architecture/
├── api/
├── components/     apps · packages
├── development/
├── operations/
├── reference/
└── changelog/
```
