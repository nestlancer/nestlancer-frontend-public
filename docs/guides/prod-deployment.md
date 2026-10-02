# Frontend Production Deployment Guide

Step-by-step guide for deploying **nestlancer-frontend** to **production**.

Repo: `nestlancer/nestlancer-frontend`  
Compose file: `docker-compose.prod.yml`  
Infisical env slug: **`prod`** (not `production`)  
Images: **GHCR** (`ghcr.io/nestlancer/frontend-*:<tag>`)

---

## Current status (as of Aug 2026)

| Item                                                                                      | Status                                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| GitHub `PRODUCTION_VPS_*` secrets                                                         | **Configured** (no fallback to `VPS_*`)                            |
| `INFISICAL_PROJECT_ID`                                                                    | **Set**                                                            |
| Variable `NESTLANCER_DEPLOY_MODE`                                                         | `compose`                                                          |
| Prod clone on VPS                                                                         | `/root/nestlancer-frontend-prod` — **exists**                      |
| SSH user                                                                                  | `root` @ `217.216.59.29`                                           |
| Production CD ever run                                                                    | **Not yet** — needs first `v*.*.*` tag or manual workflow          |
| Optional build secrets (`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`) | Not required for first deploy; set before live payments / web push |
| Same VPS as development                                                                   | Yes — isolated by path / ports / container names                   |

---

## What gets deployed

| App     | Image              | Host Port | Container Port | Public URL                       |
| ------- | ------------------ | --------- | -------------- | -------------------------------- |
| Web     | `frontend-web`     | 9100      | 9000           | `https://app.nestlancer.com`     |
| Admin   | `frontend-admin`   | 9110      | 9010           | `https://admin.nestlancer.com`   |
| Landing | `frontend-landing` | 9120      | 9020           | `https://landing.nestlancer.com` |

| Item                  | Value                                                      |
| --------------------- | ---------------------------------------------------------- |
| VPS IP                | `217.216.59.29`                                            |
| Deploy path (secret)  | `/root/nestlancer-frontend-prod`                           |
| Container name prefix | `nl-prod-frontend-*` (e.g. `nl-prod-frontend-web`)         |
| Docker network        | `nestlancer-frontend-prod`                                 |
| HTTPS routing         | Backend Caddy prod proxy (`docker-compose.prod.proxy.yml`) |

**Same-VPS coexistence:** Prod uses separate deploy path, container names, and ports from dev (9100/9110/9120 vs 9000/9010/9020). Both stacks can run simultaneously.

**Note:** Live DNS and Infisical use **`app.nestlancer.com`** for the client app.

---

## How CI/CD works (production flow)

```
Push tag v1.2.3  (or Run workflow manually)
    → Build Production Images (GitHub → GHCR)
    → Frontend CD (Production) SSH to VPS
    → git pull → Infisical prod → docker pull → compose up → smoke test
```

| Workflow file                         | Name                     | When it runs            |
| ------------------------------------- | ------------------------ | ----------------------- |
| `.github/workflows/build-images.yml`  | Build Production Images  | Tag, release, or manual |
| `.github/workflows/cd-production.yml` | Frontend CD (Production) | Tag or manual           |

Images are built on **GitHub**, not the VPS.

**Important:** Pushing to `main` does **not** deploy production. Only tags / manual production workflow do.

---

## How production images are built

All three apps share `docker/prod-monorepo.Dockerfile` + `docker/prod-monorepo.bake.hcl`.

| Step                  | What happens                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------ |
| 1. Checkpoint         | `frontend-builder` — one `pnpm install`; Next compiles (all three, or only the scoped app) |
| 2. `frontend-web`     | Thin standalone runtime                                                                    |
| 3. `frontend-admin`   | Thin standalone runtime                                                                    |
| 4. `frontend-landing` | Thin standalone runtime                                                                    |

**CI** (`.github/workflows/build-images.yml`) runs the same phases with GHA cache and `--push` to GHCR. Build-time `NEXT_PUBLIC_*` values come from Infisical / GitHub secrets.

**Local / VPS fallback** (live progress bar + elapsed + ETA; disable with `NESTLANCER_PROGRESS=0`). Bake pins `--builder nestlancer-frontend` so it can run alongside backend builds.

```bash
# All three images (phased — recommended)
pnpm docker:prod:build
# same as: ./scripts/docker/build-all-prod-images.sh

# One app (fastest iteration — only that Next app is compiled)
pnpm docker:prod:build:one frontend-web
# same as: ./scripts/docker/build-prod-image.sh frontend-web
./scripts/docker/build-group-prod-images.sh frontend-admin
# Optional durable local cache write (slow): NESTLANCER_CACHE_EXPORT=1 pnpm docker:prod:build:one …

# Checkpoint only (warm cache)
./scripts/docker/build-group-prod-images.sh frontend-builder

# One-shot (no phases)
NESTLANCER_BUILD_PHASED=0 pnpm docker:prod:build
```

**Interrupt / resume:** re-run the same command; layers reload from the buildx builder (and `.cache/docker-buildkit` when exported).

**Do not wipe BuildKit cache** between iterations. Deleting `.cache/docker-buildkit` or `docker builder prune -af` forces a cold rebuild (often **30–50+ min**). Host `apps/*/.next` is ignored by `.dockerignore` — no need to delete it for Docker builds.

### Build env knobs

| Variable                  | Default                               | Purpose                                                             |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `NESTLANCER_BUILD_TARGET` | set automatically by `build:one`      | Compile only `frontend-web` / `frontend-admin` / `frontend-landing` |
| `NESTLANCER_CACHE_EXPORT` | `1` on checkpoint; `0` on `build:one` | Write local durable cache (slow)                                    |
| `NESTLANCER_PROGRESS`     | `1`                                   | Live progress bar + ETA                                             |
| `NESTLANCER_BUILD_PHASED` | `1`                                   | Phased bake vs one-shot                                             |

### Expected timings (realistic)

| Scenario                                 | Typical wall time                                                   |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Cold full bake (empty durable cache)     | **30–50 min**                                                       |
| Warm full phased rebuild                 | **5–15 min**                                                        |
| Single app cold (compiles only that app) | **~10–20 min**                                                      |
| Single app warm / scoped `build:one`     | **~30–60s** (measured frontend-web: **33s**, skipped admin+landing) |

### Safe local Docker cleanup (keeps build cache)

```bash
docker container prune -f
docker image prune -f
# Do NOT: docker builder prune -af  or  rm -rf .cache/docker-buildkit
```

---

## One-time setup

### 1. VPS preparation

Prod clone is already present:

```bash
ssh root@217.216.59.29
cd /root/nestlancer-frontend-prod
```

If you ever need to recreate it:

```bash
git clone git@github.com:nestlancer/nestlancer-frontend.git /root/nestlancer-frontend-prod
```

**Important:** Do **NOT** reuse the dev path (`/root/nestlancer-frontend`). Prod must stay separate.

Install Docker, Node 20, pnpm, Infisical CLI (same as dev guide).

### 2. Infisical (production)

| Item             | Value                                  |
| ---------------- | -------------------------------------- |
| Project ID       | `61ae088e-7cbb-47c5-9319-d1e0e2d8996f` |
| Prod env slug    | **`prod`**                             |
| Machine identity | Must have **`prod`** read access       |

Test export:

```bash
cd /root/nestlancer-frontend-prod
infisical export --env=prod --format=dotenv \
  --projectId=61ae088e-7cbb-47c5-9319-d1e0e2d8996f > .env.infisical
chmod 600 .env.infisical
```

Key production URLs in Infisical **`prod`**:

| Variable                         | Example value                                                               |
| -------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`            | `https://app.nestlancer.com`                                                |
| `NEXT_PUBLIC_ADMIN_APP_URL`      | `https://admin.nestlancer.com`                                              |
| `NEXT_PUBLIC_API_URL`            | `https://app.nestlancer.com` (web) / `https://admin.nestlancer.com` (admin) |
| `API_UPSTREAM`                   | `https://api.nestlancer.com`                                                |
| `NEXT_PUBLIC_WS_URL`             | `https://api.nestlancer.com`                                                |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`    | Live Razorpay key (not `CHANGE_ME_*`)                                       |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile **site** key (public)                                  |
| `LOG_LEVEL`                      | `info`                                                                      |
| `NEXT_PUBLIC_API_PROXY`          | `true`                                                                      |

Build-time vars are baked into images during **Build Production Images** on GitHub. Runtime Infisical keys such as `LOG_LEVEL` apply on container start (compose `env_file` + `environment`).

### 3. GitHub Secrets (production) — configured

These are **dedicated** production secrets (no fallback to `VPS_*`).

| Secret                                | Required | Current value / notes                                      |
| ------------------------------------- | -------- | ---------------------------------------------------------- |
| `PRODUCTION_VPS_HOST`                 | Yes      | `217.216.59.29` — **set**                                  |
| `PRODUCTION_VPS_USERNAME`             | Yes      | `root` — **set**                                           |
| `PRODUCTION_VPS_PASSWORD`             | Yes      | SSH password — **set**                                     |
| `PRODUCTION_VPS_FRONTEND_DEPLOY_PATH` | Yes      | `/root/nestlancer-frontend-prod` — **set**                 |
| `INFISICAL_CLIENT_ID`                 | Yes      | Machine identity — **set**                                 |
| `INFISICAL_CLIENT_SECRET`             | Yes      | Machine identity — **set**                                 |
| `INFISICAL_PROJECT_ID`                | Yes      | `61ae088e-7cbb-47c5-9319-d1e0e2d8996f` — **set**           |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`         | Optional | Baked into images at build time — set before live payments |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`     | Optional | Baked into images at build time — set before web push      |

> Do **not** put passwords in this guide. Manage via GitHub → Settings → Secrets.

### 4. GitHub Variables

| Variable                 | Current   | Purpose                  |
| ------------------------ | --------- | ------------------------ |
| `NESTLANCER_DEPLOY_MODE` | `compose` | Docker Compose prod path |

### 5. GHCR images

After build, these packages exist:

- `ghcr.io/nestlancer/frontend-web:<tag>`
- `ghcr.io/nestlancer/frontend-admin:<tag>`
- `ghcr.io/nestlancer/frontend-landing:<tag>`

Tags: version without `v` (e.g. `1.0.0`) and `latest`.

### 6. DNS (Cloudflare)

| Host                     | Points to       | Proxy                      |
| ------------------------ | --------------- | -------------------------- |
| `app.nestlancer.com`     | `217.216.59.29` | Proxied                    |
| `admin.nestlancer.com`   | `217.216.59.29` | Proxied                    |
| `landing.nestlancer.com` | `217.216.59.29` | Proxied                    |
| `nestlancer.com` (apex)  | `217.216.59.29` | Proxied — Caddy → landing  |
| `www.nestlancer.com`     | `217.216.59.29` | Proxied — Caddy 301 → apex |

Backend **`api.nestlancer.com`** must be deployed first.

Caddy prod proxy (in backend repo) should route:

- `app.nestlancer.com` → `localhost:9100`
- `admin.nestlancer.com` → `localhost:9110`
- `landing.nestlancer.com` → `localhost:9120`
- `nestlancer.com` → landing (same as above)
- `www.nestlancer.com` → 301 → `https://nestlancer.com`
- `api.nestlancer.com` → `localhost:4000`

---

## Deploy with GitHub Actions

### Full release (recommended)

```bash
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

Coordinate both repos:

1. Tag & deploy **backend** first (API must be live on port 4000 / `api.nestlancer.com`).
2. Tag & deploy **frontend**.

Or use manual workflows in order.

### Manual workflows

1. **Build Production Images** — builds & pushes to GHCR.
2. **Frontend CD (Production)** — pulls & deploys on VPS.

### What production CD does on VPS

1. `git fetch --tags` + `git pull origin main`
2. Infisical export → `.env.infisical` (env **`prod`**)
3. `docker login ghcr.io`
4. `compose pull`
5. `compose up -d`
6. Smoke on `9100` / `9110` / `9120`

---

## Manual deploy on VPS

```bash
ssh root@217.216.59.29
cd /root/nestlancer-frontend-prod
git pull origin main

infisical export --env=prod --format=dotenv \
  --projectId=61ae088e-7cbb-47c5-9319-d1e0e2d8996f > .env.infisical
chmod 600 .env.infisical

export NESTLANCER_IMAGE_REGISTRY=ghcr.io/nestlancer
export NESTLANCER_IMAGE_TAG=latest

echo "$GHCR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin

COMPOSE_PULL=always INFISICAL_ENV=prod pnpm docker:prod:pull
COMPOSE_PULL=never INFISICAL_ENV=prod pnpm docker:prod:up
WEB_URL=http://127.0.0.1:9100 ADMIN_URL=http://127.0.0.1:9110 LANDING_URL=http://127.0.0.1:9120 \
  pnpm docker:prod:smoke
```

Ensure backend Caddy proxy is up (from backend prod repo):

```bash
cd /root/nestlancer-backend-api-prod
pnpm docker:prod:proxy:up
```

### Build locally on VPS (fallback)

```bash
cd /root/nestlancer-frontend-prod

# Phased build with progress bar + ETA
SKIP_INFISICAL_EXPORT=1 pnpm docker:prod:build

# Or one app
./scripts/docker/build-prod-image.sh frontend-web

INFISICAL_ENV=prod pnpm docker:prod:up
```

Slow on cold cache (**30–50+ min**). Prefer GHCR or `pnpm docker:prod:build:one`. Keep `.cache/docker-buildkit`. If interrupted, re-run the same build command to resume.

---

## Useful pnpm commands (production)

| Command                        | What it does                                                        |
| ------------------------------ | ------------------------------------------------------------------- |
| `pnpm docker:prod:build`       | Build all prod images (phased bake + progress/ETA; cold ~30–50 min) |
| `pnpm docker:prod:build:one`   | Build one app (`frontend-web\|admin\|landing`; scopes Next compile) |
| `pnpm docker:prod:build:group` | Build one bake group / checkpoint                                   |
| `pnpm docker:prod:pull`        | Pull from GHCR                                                      |
| `pnpm docker:prod:up`          | Start prod stack                                                    |
| `pnpm docker:prod:down`        | Stop prod stack                                                     |
| `pnpm docker:prod:ps`          | Container status                                                    |
| `pnpm docker:prod:logs`        | Follow all prod app logs (JSON on stdout)                           |
| `pnpm docker:prod:logs -- web` | Follow one app (`web` \| `admin` \| `landing`)                      |
| `pnpm docker:prod:run`         | Up only (after pull/build)                                          |
| `pnpm docker:prod:start`       | Build + up (local)                                                  |
| `pnpm docker:prod:smoke`       | HTTP 200 check on 9100/9110/9120                                    |
| `pnpm docker:prod:local:start` | Local prod-mode build (no GHCR)                                     |

**Scripts:** `./scripts/docker/build-prod-image.sh frontend-web` · `./scripts/docker/build-group-prod-images.sh frontend-builder`

**Note:** Prod host ports are offset from dev: web=9100, admin=9110, landing=9120. Caddy must route to these ports (not 9000/9010/9020).

**Progress UI:** local builds print a live bar + elapsed + ETA. Disable with `NESTLANCER_PROGRESS=0`.

**Structured logs:** see [logging.md](./logging.md). Filter with:

```bash
pnpm docker:prod:logs -- web 2>&1 | grep -E 'app\.start|auth\.|http\.(request|route)'
```

---

## Verify deployment

```bash
# VPS local (prod ports are offset: 9100/9110/9120)
curl -sf http://127.0.0.1:9100/    # web (prod)
curl -sf http://127.0.0.1:9110/    # admin (prod)
curl -sf http://127.0.0.1:9120/    # landing (prod)

# Dev ports (if also running — no conflict)
curl -sf http://127.0.0.1:9000/    # web (dev)
curl -sf http://127.0.0.1:9010/    # admin (dev)
curl -sf http://127.0.0.1:9020/    # landing (dev)

# Public HTTPS
curl -sk -o /dev/null -w '%{http_code}\n' https://app.nestlancer.com/
curl -sk -o /dev/null -w '%{http_code}\n' https://admin.nestlancer.com/
curl -sk -o /dev/null -w '%{http_code}\n' https://landing.nestlancer.com/

# Prod containers
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep nl-prod-frontend

# Startup + access logs (container stdout, not browser)
pnpm docker:prod:logs -- web 2>&1 | grep 'app.start' | head
```

Expected: HTTP `200`. Cloudflare **521** = origin down. Logs should include `event":"app.start"` after container recreate.

Browser checks:

- Login on web/admin
- API calls reach `api.nestlancer.com`
- Razorpay checkout (if payments enabled)

---

## Rollback

The rollback script resolves the GHCR image tag from the nearest `v*` git tag (`git describe --tags`). Tags are fetched during deploy and rollback.

```bash
cd /root/nestlancer-frontend-prod
COMPOSE_FILE=docker-compose.prod.yml ./scripts/deploy/rollback.sh <commit-sha>
```

Manual rollback:

```bash
cd /root/nestlancer-frontend-prod
PREV=$(cat .deploy-previous-sha)
git reset --hard "$PREV"

export NESTLANCER_IMAGE_TAG=previous-good-tag
COMPOSE_PULL=always INFISICAL_ENV=prod pnpm docker:prod:pull
COMPOSE_PULL=never INFISICAL_ENV=prod pnpm docker:prod:up
```

---

## Common problems

| Problem                                     | Fix                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| No logs in browser DevTools for server work | Expected — use `pnpm docker:prod:logs` ([logging.md](./logging.md))         |
| GHCR pull denied                            | `docker login ghcr.io` on VPS                                               |
| Wrong API URL in app                        | Rebuild images — `NEXT_PUBLIC_*` are build-time; update Infisical + rebuild |
| Infisical `prod` 401                        | Refresh GitHub secret for frontend machine identity                         |
| 521 on web/admin/landing                    | Start backend Caddy: `pnpm docker:prod:proxy:up` in backend prod path       |
| CORS / API errors                           | Deploy backend prod first; check `CORS_ORIGINS` on backend                  |
| `CHANGE_ME_RAZORPAY` in prod                | Set live key in Infisical + GitHub secret + rebuild images                  |
| CI fails on admin lint                      | Set `API_UPSTREAM` in CI or fix next.config env requirements                |
| Expected prod on `main` push                | Only **Dev** CD runs on `main`; prod needs a tag                            |

---

## Production release checklist

- [ ] Backend prod deployed and healthy (`api.nestlancer.com` / port 4000)
- [ ] Frontend CI green on `main`
- [ ] Infisical **`prod`** updated (URLs, Razorpay, push keys, Turnstile site key, `LOG_LEVEL=info`)
- [ ] OpenAPI contract aligned with backend (`pnpm contract:check`)
- [x] GitHub prod secrets set (`PRODUCTION_VPS_*`, Infisical)
- [x] Prod clone exists at `/root/nestlancer-frontend-prod`
- [ ] Optional: `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` if needed
- [ ] Push tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
- [ ] Watch **Build Production Images** + **Frontend CD (Production)**
- [ ] Verify web, admin, landing HTTPS
- [ ] Smoke test login and one critical flow

---

## Deploy order (both repos)

For a full production release:

```
1. Backend: tag vX.Y.Z → build images → CD → migrate → api.nestlancer.com OK
   Deploys to: /root/nestlancer-backend-api-prod (gateway on port 4000)
2. Frontend: tag vX.Y.Z → build images → CD → web/admin/landing OK
   Deploys to: /root/nestlancer-frontend-prod (ports 9100/9110/9120)
3. Backend: ensure Caddy prod proxy routes:
   - api.nestlancer.com → localhost:4000
   - app.nestlancer.com → localhost:9100
   - admin.nestlancer.com → localhost:9110
   - landing.nestlancer.com → localhost:9120
```

Use the **same tag version** on both repos for traceability.

**Dev and prod coexist:** Dev runs on ports 3000/9000/9010/9020 with containers `nl-*`. Prod runs on ports 4000/9100/9110/9120 with containers `nl-prod-*`. No conflicts.

---

## Related docs (in repo)

- `docs/guides/dev-deployment.md` — development (same VPS)
- `docs/guides/production-vps-deploy.md`
- `docs/guides/infisical.md`
- `docs/guides/environment-variables.md`
- `docs/guides/logging.md` — container JSON logs (`pnpm docker:prod:logs`)
- `docker/prod-monorepo.Dockerfile` — shared monorepo prod image stages
- `docker/prod-monorepo.bake.hcl` — bake targets / groups
