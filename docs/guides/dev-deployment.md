# Frontend Dev Deployment Guide

Step-by-step guide for deploying **nestlancer-frontend** to the **development** stack on the VPS.

Repo: `nestlancer/nestlancer-frontend`  
Compose file: `docker-compose.dev.yml`  
Infisical env slug: **`dev`**

---

## Current status (as of Aug 2026)

| Item                                | Status                               |
| ----------------------------------- | ------------------------------------ |
| Frontend CI on `main`               | Working (green)                      |
| Frontend CD (Dev) after CI          | Working (auto-deploys)               |
| GitHub Secrets (`VPS_*`, Infisical) | Configured                           |
| Variable `NESTLANCER_DEPLOY_MODE`   | `compose`                            |
| SSH user                            | `root`                               |
| Deploy path on VPS                  | `/root/nestlancer-frontend`          |
| Same VPS as production              | Yes — separate path/ports/containers |

---

## What gets deployed

| App              | Container                         | Port | Public URL                           |
| ---------------- | --------------------------------- | ---- | ------------------------------------ |
| Web (client app) | `nestlancer-frontend-web-dev`     | 9000 | `https://dev-web.nestlancer.com`     |
| Admin            | `nestlancer-frontend-admin-dev`   | 9010 | `https://dev-admin.nestlancer.com`   |
| Landing          | `nestlancer-frontend-landing-dev` | 9020 | `https://dev-landing.nestlancer.com` |

| Item                         | Value                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| VPS IP                       | `217.216.59.29`                                              |
| Default / secret deploy path | `/root/nestlancer-frontend` (via `VPS_FRONTEND_DEPLOY_PATH`) |
| Docker network               | `nestlancer-dev`                                             |
| HTTPS routing                | Backend Caddy (`nl-dev-proxy`) on same VPS                   |

Frontend containers join the backend Docker network so Caddy can proxy to them.

**Same-VPS coexistence:** Dev and prod use separate deploy paths, container names, and ports. Prod runs on ports **9100/9110/9120** with `nl-prod-frontend-*` containers in `/root/nestlancer-frontend-prod`. Both stacks can run simultaneously without conflicts.

---

## How CI/CD works

```
Push to main
    → Frontend CI runs (lint, type-check, build, contract check, e2e)
    → If CI passes → Frontend CD (Dev) runs automatically
    → GitHub SSH to VPS → git pull → Infisical export → docker compose up
```

| Workflow file              | Name              | When it runs                           |
| -------------------------- | ----------------- | -------------------------------------- |
| `.github/workflows/ci.yml` | Frontend CI       | Every push/PR to `main`                |
| `.github/workflows/cd.yml` | Frontend CD (Dev) | After CI succeeds on `main`, or manual |

**Note:** Dev CD does **NOT** trigger on version tags (`v*.*.*`). Tags only trigger **production** CD.

---

## One-time setup

### 1. Clone repo on VPS

Already in use:

```bash
ssh root@217.216.59.29
cd /root/nestlancer-frontend
```

If you ever need a fresh clone:

```bash
git clone git@github.com:nestlancer/nestlancer-frontend.git /root/nestlancer-frontend
```

### 2. Install tools on VPS

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# Node 20 + pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
corepack enable && corepack prepare pnpm@9.15.0 --activate

# Infisical CLI
curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | sudo -E bash
apt-get update && apt-get install -y infisical
```

### 3. Infisical (secrets)

| Item             | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| Project          | `nestlancer-frontend`                                         |
| Project ID       | `61ae088e-7cbb-47c5-9319-d1e0e2d8996f` (in `.infisical.json`) |
| Dev env slug     | **`dev`**                                                     |
| Machine identity | `github-actions-nestlancer-frontend-ui-dev`                   |

Test export:

```bash
cd /root/nestlancer-frontend
infisical export --env=dev --format=dotenv \
  --projectId=61ae088e-7cbb-47c5-9319-d1e0e2d8996f > .env.infisical
chmod 600 .env.infisical
```

Important frontend env vars (dev):

- `NEXT_PUBLIC_API_URL` → `https://dev-api.nestlancer.com` or per-app dev URL
- `API_UPSTREAM` → `https://dev-api.nestlancer.com`
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_APP_URL`

See `.env.development.example` for full list.

### 4. GitHub Secrets (configured)

| Secret                     | Required          | Current value / notes                            |
| -------------------------- | ----------------- | ------------------------------------------------ |
| `VPS_HOST`                 | Yes               | `217.216.59.29` — **set**                        |
| `VPS_USERNAME`             | Yes               | `root` — **set**                                 |
| `VPS_PASSWORD`             | Yes               | SSH password — **set**                           |
| `INFISICAL_CLIENT_ID`      | Yes               | Machine identity — **set**                       |
| `INFISICAL_CLIENT_SECRET`  | Yes               | Machine identity — **set**                       |
| `VPS_FRONTEND_DEPLOY_PATH` | Yes (recommended) | `/root/nestlancer-frontend` — **set**            |
| `INFISICAL_PROJECT_ID`     | Optional          | `61ae088e-7cbb-47c5-9319-d1e0e2d8996f` — **set** |

> Do **not** put passwords in this guide. Rotate via GitHub Secrets if compromised.

### 5. GitHub Variables

| Variable                 | Current   | Purpose             |
| ------------------------ | --------- | ------------------- |
| `NESTLANCER_DEPLOY_MODE` | `compose` | Docker Compose path |

### 6. DNS (Cloudflare)

Point to `217.216.59.29`:

- `dev-web.nestlancer.com`
- `dev-admin.nestlancer.com`
- `dev-landing.nestlancer.com`

Dev subdomains use **DNS only** (grey cloud) in current setup — OK for Let's Encrypt via Caddy.

### 7. Backend must be running

Frontend dev needs backend API and Caddy:

- Backend Dev CD healthy (`dev-api.nestlancer.com`)
- Caddy container `nl-dev-proxy` listening on 80/443
- Docker network `nestlancer-dev` exists (CD creates/ensures it)

Deploy backend first if this is a fresh VPS.

---

## Deploy with GitHub Actions

### Automatic (merge to main)

1. PR → **Frontend CI** must pass (lint, build, contract, e2e).
2. Merge to `main`.
3. **Frontend CD (Dev)** runs after CI succeeds.

### Manual

1. **Actions** → **Frontend CD (Dev)** → **Run workflow**.

### What CD does on VPS

1. Ensure deploy path exists (clone if missing)
2. Ensure `nestlancer-dev` Docker network exists
3. `git pull origin main`
4. Infisical export `dev` → `.env.infisical`
5. Reset/recreate compose volumes when needed, then `up`
6. Smoke / health as configured in workflow

---

## Manual deploy on VPS

```bash
ssh root@217.216.59.29
cd /root/nestlancer-frontend

git pull origin main

infisical export --env=dev --format=dotenv \
  --projectId=61ae088e-7cbb-47c5-9319-d1e0e2d8996f > .env.infisical
chmod 600 .env.infisical

pnpm docker:build
pnpm docker:up

# Verify
pnpm docker:verify:dev-host
curl -sk https://dev-web.nestlancer.com/
curl -sk https://dev-admin.nestlancer.com/
curl -sk https://dev-landing.nestlancer.com/
```

### Useful pnpm commands (dev)

| Command                       | What it does            |
| ----------------------------- | ----------------------- |
| `pnpm docker:start`           | Build + up              |
| `pnpm docker:build`           | Build dev images        |
| `pnpm docker:up`              | Start containers        |
| `pnpm docker:down`            | Stop containers         |
| `pnpm docker:ps`              | List containers         |
| `pnpm docker:logs`            | All logs                |
| `pnpm docker:logs:web`        | Web app logs            |
| `pnpm docker:logs:admin`      | Admin logs              |
| `pnpm docker:logs:landing`    | Landing logs            |
| `pnpm docker:verify:dev-host` | Check public HTTPS URLs |

---

## Verify deployment

```bash
# Local ports on VPS
curl -sf http://127.0.0.1:9000/    # web
curl -sf http://127.0.0.1:9010/    # admin
curl -sf http://127.0.0.1:9020/    # landing

# Public HTTPS
curl -sk -o /dev/null -w '%{http_code}\n' https://dev-web.nestlancer.com/
curl -sk -o /dev/null -w '%{http_code}\n' https://dev-admin.nestlancer.com/
curl -sk -o /dev/null -w '%{http_code}\n' https://dev-landing.nestlancer.com/
```

Expected: HTTP `200`.

---

## Rollback

```bash
cd /root/nestlancer-frontend
PREV=$(cat .deploy-previous-sha)
git reset --hard "$PREV"
docker compose -f docker-compose.dev.yml up -d
```

---

## Common problems

| Problem                                     | Fix                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| CD skipped                                  | Frontend CI failed — check Actions tab                                          |
| `API_UPSTREAM required in production` in CI | CI sets NODE_ENV; ensure build args/env in workflow — local: set `API_UPSTREAM` |
| 404 / connection refused on dev-web         | Backend Caddy not running; check `nl-dev-proxy` and backend network             |
| Infisical 401                               | Regenerate machine identity secret in GitHub                                    |
| Empty / missing container logs              | Use `pnpm docker:logs:web` — see [logging.md](./logging.md)                     |
| Admin lint fails in CI                      | Set `API_UPSTREAM` or `NEXT_PUBLIC_API_URL` in CI env                           |
| OpenAPI contract check fails                | Run `pnpm openapi:refresh` after backend API changes                            |

---

## When backend API changes

1. Deploy backend dev first.
2. Update frontend OpenAPI client if needed:

```bash
pnpm pull:openapi    # pull spec from dev API
pnpm codegen         # regenerate api-client
pnpm contract:check  # verify no drift
```

3. Commit and merge frontend changes.

---

## Checklist before merge to main

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm build` passes
- [ ] `pnpm contract:check` passes
- [ ] Infisical `dev` has correct API URLs, `LOG_LEVEL=debug`, Turnstile site key
- [x] GitHub secrets configured
- [ ] Backend dev is up (for integration)

---

## Related docs (in repo)

- `docs/guides/prod-deployment.md` — production (same VPS, different path)
- `docs/guides/infisical.md`
- `docs/guides/environment-variables.md`
- `docs/guides/logging.md` — container JSON logs (`pnpm docker:logs:web`)
- `docs/guides/troubleshooting.md`
