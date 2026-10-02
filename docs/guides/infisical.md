# Infisical — Frontend

Same pattern as [nestlancer-backend-api/docs/guides/infisical.md](../../../nestlancer-backend-api/docs/guides/infisical.md).

## Project

| Item                 | Value                                                              |
| :------------------- | :----------------------------------------------------------------- |
| Infisical project    | `nestlancer-frontend`                                              |
| Project ID           | `61ae088e-7cbb-47c5-9319-d1e0e2d8996f` (also in `.infisical.json`) |
| Dev machine identity | `github-actions-nestlancer-frontend-ui-dev`                        |

## Environment slugs

| Infisical slug | Local reference file | Used by                                                  |
| :------------- | :------------------- | :------------------------------------------------------- |
| `dev`          | `.env.development`   | `pnpm docker:up`, `.github/workflows/cd.yml`             |
| `prod`         | `.env.production`    | `compose-prod.sh`, `.github/workflows/cd-production.yml` |

Use slug **`dev`**, not `development`. Use slug **`prod`**, not `production`.

## Repo files (root only)

| File                       | Purpose                                  |
| :------------------------- | :--------------------------------------- |
| `.env.development`         | Committed fallback for local `pnpm dev`  |
| `.env.production`          | Production reference / K8s secret source |
| `.env.development.example` | Template for Infisical `dev` import      |
| `.env.production.example`  | Template for Infisical `prod` import     |
| `.env.infisical`           | Generated at deploy — never commit       |
| `.infisical.json`          | Project link (safe to commit)            |

All Next apps load root env via `@nestlancer/config/load-root-env.mjs`.

**Do not store `NODE_ENV` in Infisical.** Next.js sets it per command (`development` for `next dev`, `production` for `next build`). Overriding it in `.env.infisical` breaks React during production builds.

## Local commands

```bash
# Export for Docker dev
infisical export --env=dev --format=dotenv > .env.infisical
chmod 600 .env.infisical

# Docker dev (auto-export when CLI is logged in)
pnpm docker:up

# Without Infisical CLI
SKIP_INFISICAL_EXPORT=1 pnpm docker:up

# Production compose (GHCR images)
INFISICAL_ENV=prod ./scripts/docker/compose-prod.sh up -d

# Local production-mode build (builds on machine)
INFISICAL_ENV=prod ./scripts/docker/compose-prod-local.sh build
pnpm docker:prod:local:start

# Verify machine identity (CI/VPS)
INFISICAL_CLIENT_ID=... INFISICAL_CLIENT_SECRET=... ./scripts/infisical/verify-export.sh dev
```

## GitHub Actions secrets

Add in **Settings → Secrets and variables → Actions** on `nestlancer-frontend`:

### Dev deploy (`.github/workflows/cd.yml`)

| Secret                     | Required | Notes                                            |
| :------------------------- | :------- | :----------------------------------------------- |
| `INFISICAL_CLIENT_ID`      | Yes      | From `github-actions-nestlancer-frontend-ui-dev` |
| `INFISICAL_CLIENT_SECRET`  | Yes      | Shown once when creating client secret           |
| `VPS_HOST`                 | Yes      | Dev VPS SSH host                                 |
| `VPS_USERNAME`             | Yes      | SSH user                                         |
| `VPS_PASSWORD`             | Yes      | SSH password                                     |
| `VPS_FRONTEND_DEPLOY_PATH` | No       | Default: `/root/nestlancer-frontend`             |
| `INFISICAL_PROJECT_ID`     | No       | Default from committed `.infisical.json`         |

CI (`.github/workflows/ci.yml`) does **not** use Infisical.

### Production deploy (`.github/workflows/cd-production.yml`)

Same machine identity (`github-actions-nestlancer-frontend-ui-dev`) with read access to **`prod`**:

| Secret                      | Required            |
| :-------------------------- | :------------------ |
| `INFISICAL_CLIENT_ID`       | Yes                 |
| `INFISICAL_CLIENT_SECRET`   | Yes                 |
| `PRODUCTION_VPS_HOST`       | Yes                 |
| `PRODUCTION_VPS_USERNAME`   | Yes                 |
| `PRODUCTION_VPS_PASSWORD`   | Yes                 |
| `NESTLANCER_IMAGE_REGISTRY` | Yes (for GHCR pull) |

## What CD does

**Dev (`cd.yml`):** SSH to VPS → `git pull` → Infisical export `--env=dev` → `.env.infisical` → `docker compose -f docker-compose.dev.yml up -d`

**Production (`cd-production.yml`):** SSH → export `--env=prod` → compose prod up (or k3s deploy)

## Infisical UI checklist

1. Project `nestlancer-frontend` has environments `dev` and `prod` with all keys from `.env.development.example` / `.env.production.example`
2. Machine identity `github-actions-nestlancer-frontend-ui-dev` is added under **Project Settings → Machine Identities**
3. Identity has read access to **`dev`** and **`prod`**
4. GitHub repo secrets `INFISICAL_CLIENT_ID` + `INFISICAL_CLIENT_SECRET` are set
5. Logging: `LOG_LEVEL=debug` (`dev`) and `LOG_LEVEL=info` (`prod`)
6. Turnstile: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set in **both** `dev` and `prod` (public site key only — secret stays on backend)
7. Prod: do **not** set `NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN`

## Current shared secrets (high level)

| Key                              | `dev`                   | `prod`                   |
| :------------------------------- | :---------------------- | :----------------------- |
| `LOG_LEVEL`                      | `debug`                 | `info`                   |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare site key     | same                     |
| `NEXT_PUBLIC_API_PROXY`          | `true`                  | `true`                   |
| `NEXT_PUBLIC_LANDING_URL`        | `https://dev-landing.…` | `https://nestlancer.com` |

Compose also injects `NESTLANCER_SERVICE` per container at runtime (not required in Infisical).

## Backend alignment

| Frontend                                   | Backend                  |
| :----------------------------------------- | :----------------------- |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`              | `RAZORPAY_KEY_ID`        |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`          | `VAPID_PUBLIC_KEY`       |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`           | `TURNSTILE_SECRET_KEY`   |
| `NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN` (dev) | `TURNSTILE_BYPASS_TOKEN` |
| `NEXT_PUBLIC_APP_URL`                      | `FRONTEND_URL`           |

Container log viewing: [logging.md](./logging.md).
