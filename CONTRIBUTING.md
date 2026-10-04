# Contributing to Nestlancer Frontend

How to get set up, how changes are reviewed, and the non-negotiable rules for this monorepo.

## Before you start

Read [`docs/development/setup.md`](docs/development/setup.md), then
[`docs/architecture/overview.md`](docs/architecture/overview.md). Node `>=20` and
`pnpm@9.15.0` (see `packageManager` in `package.json`) are required.

## Workflow

- Work lands on `main` via pull request. CI runs lint, type-check, tests, and contract checks as
  configured under `.github/workflows/`.
- Husky + commitlint enforce conventional commits locally (`pnpm prepare` installs hooks).
- Merging to `main` may trigger image/deploy workflows — see [`docs/operations/`](docs/operations/README.md).

## Before opening a PR

```bash
pnpm lint
pnpm type-check
pnpm test
# If you touched OpenAPI consumption / api-client:
pnpm contract:check
# If you changed routes/features that docs cover:
pnpm docs:components
```

Run `pnpm test:e2e` for user journeys you touch when a stack is available.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `refactor`,
`chore`, `test`, `ci`, `build`). Changelog entries are generated from this history
(`pnpm docs:changelog`).

## Architecture boundaries

- Do not casually rename or merge packages under `apps/*` or `packages/*`.
- Prefer shared packages (`@nestlancer/*`) over duplicating logic across apps.
- **Never hand-edit** `packages/api-client/src/generated/**` — use `pnpm codegen` /
  `pnpm openapi:refresh`.
- Keep authenticated dashboard UI guidance separate from public marketing/landing UI rules.

## Secrets

Real secrets live in Infisical — see [`docs/operations/secrets-infisical.md`](docs/operations/secrets-infisical.md).
Never commit `.env` files with real values, tokens, or private keys.

## Documentation

- Canonical docs live under `docs/` — index: [`docs/README.md`](docs/README.md).
- Script catalog: [`scripts/README.md`](scripts/README.md).
- After moving docs or scripts, update callers and regenerate with `pnpm docs:components` /
  `pnpm docs:changelog` when appropriate.
