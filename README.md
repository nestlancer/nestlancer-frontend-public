# Nestlancer Frontend

Next.js monorepo for the Nestlancer UI platform: client portal (`web`), operations console (`admin`), and marketing site (`landing`) with shared internal packages.

## Table of Contents

- [Project Analysis](#project-analysis)
- [System Architecture](#system-architecture)
- [Monorepo Overview](#monorepo-overview)
- [Tech Stack](#tech-stack)
- [Required Local Toolchain](#required-local-toolchain)
- [Environment and Infisical](#environment-and-infisical)
- [Run Locally (Development)](#run-locally-development)
- [Backend Connectivity](#backend-connectivity)
- [Dev VPS Public Access](#dev-vps-public-access-dev-hosts)
- [Build and Release GHCR Images](#build-and-release-ghcr-images)
- [Deploy to VPS (Compose)](#deploy-to-vps-compose)
- [Deploy to VPS (K3s)](#deploy-to-vps-k3s)
- [Commands](#commands)
- [Quality Gates and Git Hooks](#quality-gates-and-git-hooks)
- [Beginner Guide](#beginner-guide)
- [Operator Runbook (Day-2 Ops)](#operator-runbook-day-2-ops)
- [Troubleshooting](#troubleshooting)

## Project Analysis

This repository is a structured frontend platform monorepo optimized for shared UI and API contract consistency.

- **Strengths**
  - Clear app boundaries (`apps/web`, `apps/admin`, `apps/landing`)
  - Shared package layer (`packages/*`) reduces duplication and enforces consistent UX/contracts
  - API client is contract-generated (`orval`) with drift checks in CI
  - Production deploy model is aligned with backend (GHCR + Infisical + Compose/K3s)
- **Operational implications**
  - Public runtime variables (`NEXT_PUBLIC_*`) are build-time sensitive and require image rebuilds
  - API URL/cookie behavior varies by environment and requires explicit proxy strategy for localhost

## System Architecture

```text
Browser -> CDN/Proxy -> Next.js Apps (web/admin/landing)
                     |                |
                     |                +-> SSR/Route handlers
                     |
                     +-> /api proxy (optional) -> Backend Gateway
                                           |
                                           +-> REST + WS endpoints
```

```mermaid
flowchart LR
  U[Browser] --> RP[Reverse Proxy / CDN]
  RP --> W[web app :9000]
  RP --> A[admin app :9010]
  RP --> L[landing app :9020]
  W -->|API calls| GW[Backend Gateway]
  A -->|API calls| GW
  L -->|API calls (if needed)| GW
  W -->|Socket.IO| GW
  A -->|Socket.IO| GW
```

## Monorepo Overview

- Apps:
  - `apps/web` - customer-facing product app
  - `apps/admin` - admin and operations panel
  - `apps/landing` - public marketing site
- Shared packages:
  - `@nestlancer/api-client`, `@nestlancer/ui`, `@nestlancer/auth`, `@nestlancer/websocket`, plus typed utilities/config/constants packages

## Tech Stack

- Next.js 14 + React + TypeScript
- Turborepo + pnpm workspaces
- Orval-generated API client from backend OpenAPI
- Docker Compose for dev/prod container orchestration
- GHCR + GitHub Actions for image CI/CD
- Infisical for environment/secret management

## Required Local Toolchain

`pnpm install` only installs JavaScript dependencies. Install these tools on your machine:

### Mandatory

- `git`
- `node` `>=20`
- `pnpm` `>=9`
- `docker`
- `docker compose` plugin
- `bash`, `curl`

### Mandatory for real project workflow

- `infisical` CLI (for `.env.infisical` generation in docker dev/prod scripts)

### Optional but recommended

- `kubectl` (for K3s deployment)
- `k3s` / `helm` (if using Kubernetes deployment mode)

## Environment and Infisical

Environment files are repository-root level (not per app):

- `.env.development` (fallback for host dev)
- `.env.production` (template/reference)
- `.env.infisical` (generated, gitignored, used by compose scripts)

Infisical mapping:

- `dev` -> local/dev VPS (CD: `.github/workflows/cd.yml`)
- `prod` -> production deployment (CD: `.github/workflows/cd-production.yml`)

GitHub Actions machine identity: `github-actions-nestlancer-frontend-ui-dev`  
Secrets: `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`

Quick setup:

```bash
infisical init
infisical login
infisical export --env=dev --format=dotenv > .env.infisical
chmod 600 .env.infisical
```

Reference docs:

- `docs/operations/secrets-infisical.md`
- `docs/reference/environment-variables.md`
- `docs/operations/logging.md` — container JSON logs (`pnpm docker:prod:logs`)
- `.env.production.example`

## Run Locally (Development)

### Docker-based development (recommended)

```bash
pnpm install
pnpm docker:start
```

This uses `docker-compose.dev.yml` with a Caddy reverse-proxy overlay (`docker-compose.local.yml`) via `scripts/docker/compose-dev.sh`.

Tuned for a **6c / 12GB VPS** (same hardening pattern as the backend):

- Hard mem/CPU limits on every container
- Hybrid watch: default `WATCH_APPS=web` (`next dev`); admin/landing run `next start`
- File polling **off** by default (Linux inotify); opt in only if needed
- Sequential bring-up so Next builds do not stampede RAM/SSH

```bash
# default (recommended on 12GB)
pnpm docker:up

# opt-in more HMR (uses more RAM/CPU)
WATCH_APPS=web,admin pnpm docker:up

# only if bind-mount FS events miss changes (Docker Desktop macOS/Windows)
WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true pnpm docker:up
```

By default, Caddy listens on `80`/`443` and routes:

- `dev-web.nestlancer.com` -> `web:9000`
- `dev-admin.nestlancer.com` -> `admin:9010`
- `dev-landing.nestlancer.com` -> `landing:9020`

```bash
# optional overrides (defaults shown)
export DEV_WEB_HOST=dev-web.nestlancer.com
export DEV_ADMIN_HOST=dev-admin.nestlancer.com
export DEV_LANDING_HOST=dev-landing.nestlancer.com
export LETSENCRYPT_EMAIL=ops@nestlancer.com
pnpm docker:up
pnpm docker:verify:dev-host
pnpm docker:proxy:logs
```

Disable proxy overlay if needed:

```bash
ENABLE_LOCAL_PROXY=0 pnpm docker:up
```

Default app ports:

- web: `9000`
- admin: `9010`
- landing: `9020`

### Host-only development

```bash
pnpm install
pnpm dev
```

You can also scope to one app using Turborepo filters.

## Backend Connectivity

Primary backend variables:

- `NEXT_PUBLIC_API_URL` (browser API base)
- `NEXT_PUBLIC_WS_URL` (Socket.IO origin)
- `NEXT_PUBLIC_SOCKET_IO_PATH` (default `/ws/socket.io`)
- `API_UPSTREAM` (server-side proxy upstream)

For localhost cookie-safe proxy flow:

```bash
NEXT_PUBLIC_API_URL=http://localhost:9000
API_UPSTREAM=http://localhost:3000
NEXT_PUBLIC_API_PROXY=true
```

Important: `NEXT_PUBLIC_*` values are injected at build time for production images. If they are wrong in production, rebuild and redeploy images.

## Dev VPS Public Access (`dev-*` hosts)

Use this when frontend dev Docker runs on a VPS and teammates access it over the internet.

Checklist:

1. DNS A records point to VPS public IP:
   - `dev-web.nestlancer.com`
   - `dev-admin.nestlancer.com`
   - `dev-landing.nestlancer.com`
2. Provider firewall allows TCP `80` and `443`.
3. UFW allows `80`/`443` and permits Docker forwarded web traffic.
4. Start stack with `pnpm docker:up`.
5. Verify with `pnpm docker:verify:dev-host`.

If localhost checks pass but public HTTPS times out, fix provider/UFW Docker networking before changing frontend app code.

## Build and Release GHCR Images

Workflow: `.github/workflows/build-images.yml`

- Trigger: release `published`, tag `v*.*.*`, or manual
- Images: `frontend-web`, `frontend-admin`, `frontend-landing`
- Registry format: `ghcr.io/<owner>/<image-id>:<tag>`
- Build model: shared monorepo Dockerfile + Bake — install once, three Next compiles, then thin runtimes (phased CI)

Release process:

1. Create and publish release tag (for example `v1.0.0`)
2. Wait for **Build Production Images**
3. Verify packages in GitHub Packages

Local fallback build (progress bar + ETA; keep BuildKit cache):

```bash
export NESTLANCER_IMAGE_REGISTRY=ghcr.io/<org>
export NESTLANCER_IMAGE_TAG=v1.0.0

# Prefer one app while iterating (scopes Next compile; ~30–60s when warm)
pnpm docker:prod:build:one frontend-web
./scripts/docker/build-group-prod-images.sh frontend-builder

# Full bake only when needed (cold: 30–50 min)
pnpm docker:prod:build
```

Do **not** wipe `.cache/docker-buildkit` or run `docker builder prune -af` between iterations. Details: `docs/operations/deployment-prod-compose.md`.

## Deploy to VPS (Compose)

Production workflow: `.github/workflows/cd-production.yml`

Flow:

1. SSH into VPS
2. Pull latest code
3. Export `.env.infisical` from Infisical `prod`
4. Pull GHCR images (if registry secret exists) or build on VPS fallback
5. `compose-prod.sh up -d`

Required GitHub secrets:

- `PRODUCTION_VPS_HOST`
- `PRODUCTION_VPS_USERNAME`
- `PRODUCTION_VPS_PASSWORD`
- `PRODUCTION_VPS_FRONTEND_DEPLOY_PATH` (optional)
- `INFISICAL_CLIENT_ID`
- `INFISICAL_CLIENT_SECRET`
- `INFISICAL_PROJECT_ID` (optional)
- `NESTLANCER_IMAGE_REGISTRY` (for pull-based deploy)

Manual production lifecycle:

```bash
INFISICAL_ENV=prod ./scripts/docker/compose-prod.sh pull
INFISICAL_ENV=prod ./scripts/docker/compose-prod.sh up -d
./scripts/deploy/smoke-health.sh
```

## Deploy to VPS (K3s)

K3s workflow is supported and generated from workload manifest.

1. Configure registry in `scripts/docker/workloads.manifest.json`
2. `pnpm k3s:generate`
3. Create GHCR pull secret in namespace `nestlancer-frontend`
4. Apply overlay `deploy/k3s/overlays/production`

## Commands

- `pnpm dev` - run all apps
- `pnpm build` - production build for all apps/packages
- `pnpm lint` - lint all workspaces
- `pnpm type-check` - type checking
- `pnpm test` - workspace tests
- `pnpm pull:openapi` - pull backend merged OpenAPI spec
- `pnpm codegen` - regenerate API client
- `pnpm contract:check` - generated client + contract lint validation
- `pnpm docker:start` - dev docker lifecycle (build + up)
- `pnpm docker:verify:dev-host` - verify local/public host routing for dev domains
- `pnpm docker:proxy:logs` - Caddy (`nl-frontend-dev-proxy`) logs
- `pnpm docker:prod:build` - build all three production images (phased + progress/ETA; cold ~30–50 min)
- `pnpm docker:prod:build:one` - build one app (`frontend-web` | `frontend-admin` | `frontend-landing`)
- `pnpm docker:prod:build:group` - build one bake group / checkpoint
- `pnpm docker:prod:start` - production image build + compose up locally
- `pnpm docker:prod:local:start` - local production-like compose without registry pull
- `pnpm k3s:generate` - regenerate k3s manifests

## Quality Gates and Git Hooks

Husky hooks run after `pnpm install`:

- `pre-commit` - `lint-staged` for source files
- `commit-msg` - commitlint conventional commit validation
- `pre-push` - `pnpm contract:check`

Recommended commit style: `type(scope): subject`

## Beginner Guide

For a beginner-first walkthrough (new laptop setup, local run, GHCR release, VPS deploy, rollback), use:

- [`docs/development/setup.md`](docs/development/setup.md)
- [`docs/README.md`](docs/README.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`SECURITY.md`](SECURITY.md)

## Operator Runbook (Day-2 Ops)

### A) Rapid Incident Triage (first 10 minutes)

- [ ] identify impacted app(s): `web`, `admin`, `landing`
- [ ] check container health: `pnpm docker:prod:ps`
- [ ] verify smoke endpoints via `./scripts/deploy/smoke-health.sh`
- [ ] confirm active image tag and last deployment timestamp
- [ ] check whether failure is frontend-only or backend connectivity

### B) Log Triage Sequence

Server JSON logs land in **container stdout** (not the browser console). Full guide: `docs/operations/logging.md`.

```bash
# 1) Combined prod logs
pnpm docker:prod:logs

# 2) App-specific (pnpm)
pnpm docker:prod:logs -- web
pnpm docker:prod:logs -- admin
pnpm docker:prod:logs -- landing

# 3) Filter structured events
pnpm docker:prod:logs -- web 2>&1 | grep -E 'app\.start|auth\.|http\.(request|route)'

# Dev stack equivalents
pnpm docker:logs:web
pnpm docker:logs:admin
pnpm docker:logs:landing
```

Checklist:

- [ ] look for `event":"app.start"` after recreate (instrumentation)
- [ ] correlate with `correlationId` across `http.request` / `http.route` / `auth.*`
- [ ] look for build-time env mismatch (`NEXT_PUBLIC_*`)
- [ ] verify runtime upstream (`API_UPSTREAM`) and backend reachability
- [ ] validate CORS/cookie/domain assumptions after domain or proxy changes
- [ ] confirm `LOG_LEVEL` in Infisical / container env (`docker exec … printenv LOG_LEVEL`)

### C) Rollback Procedure (Compose)

```bash
cd /root/nestlancer-frontend
COMPOSE_FILE=docker-compose.prod.yml ./scripts/deploy/rollback.sh <previous-sha>
pnpm docker:prod:ps
./scripts/deploy/smoke-health.sh
```

- [ ] rollback app images
- [ ] verify app and admin login journey
- [ ] document rollback reason and affected user journeys

### D) Incident Closure Checklist

- [ ] root cause documented (frontend code, env mismatch, upstream outage, or proxy)
- [ ] short-term mitigation complete
- [ ] long-term fix ticket created
- [ ] release checklist updated if a gap was found
- [ ] postmortem notes shared

## Troubleshooting

- If production uses wrong API URL, update `NEXT_PUBLIC_*`, rebuild image, push, redeploy.
- If local login cookies fail, switch to same-origin proxy settings (`NEXT_PUBLIC_API_PROXY=true` + `API_UPSTREAM`).
- If deploy builds on VPS unexpectedly, confirm `NESTLANCER_IMAGE_REGISTRY` secret exists.
- If GHCR pulls fail, check package visibility and VPS `docker login ghcr.io`.
- If `dev-web`/`dev-admin`/`dev-landing` time out publicly but local host-header checks pass, fix VPS firewall/UFW Docker rules and DNS first.

---

License: MIT. See `LICENSE`.
