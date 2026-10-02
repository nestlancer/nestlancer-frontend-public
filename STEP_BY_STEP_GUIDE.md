# Nestlancer Frontend - Step-by-Step Guide (Beginner)

This is the beginner guide for frontend repository operations.

Use this file for:

- setting up frontend on a new laptop
- running web/admin/landing locally
- releasing frontend images to GHCR
- deploying frontend to VPS
- rollback and production troubleshooting

---

## 1) What this frontend contains

Apps:

- `web` (port 9000)
- `admin` (port 9010)
- `landing` (port 9020)

Important:

- `NEXT_PUBLIC_*` values are baked into production images at build time.
- If these are wrong, rebuild and redeploy is required.

---

## 2) Tools you must install

Install these first:

- `git`
- `node` 20+
- `pnpm` 9+
- `docker`
- `docker compose`
- `bash`
- `curl`
- `infisical` CLI

Optional:

- `kubectl` (if K3s path)
- `jq`

Verify:

```bash
git --version
node -v
pnpm -v
docker --version
docker compose version
infisical --version
```

Expected: all commands print version output without errors.

---

## 3) New laptop setup checklist (copy-paste)

```bash
cd /root/workspace
git clone <frontend-repo-url> nestlancer-frontend
cd /root/workspace/nestlancer-frontend

pnpm install

infisical init
infisical login
infisical export --env=dev --format=dotenv > .env.infisical
chmod 600 .env.infisical

pnpm docker:up   # includes Caddy on ports 80/443 when ENABLE_LOCAL_PROXY=1 (default)
```

On a **dev VPS** with public hostnames, complete [section 13](#13-dev-vps--public-frontend-dev-web--dev-admin--dev-landing) after `pnpm docker:up`.

Expected:

- containers for web/admin/landing start successfully (including `nl-frontend-dev-proxy` / Caddy on VPS)
- no fatal errors in compose output

Open (direct ports):

- `http://localhost:9000`
- `http://localhost:9010`
- `http://localhost:9020`

Or via Caddy hostnames (after DNS + `pnpm docker:verify:dev-host`):

- `https://dev-web.nestlancer.com`
- `https://dev-admin.nestlancer.com`
- `https://dev-landing.nestlancer.com`

---

## 4) Local verification checklist

- [ ] `web` opens on `9000`
- [ ] `admin` opens on `9010`
- [ ] `landing` opens on `9020`
- [ ] `pnpm docker:verify:dev-host` passes local host-header checks
- [ ] login/API calls are reaching backend (`API_UPSTREAM` / `NEXT_PUBLIC_API_PROXY`)

If local cookie issues occur, verify proxy env setup in repo README.

```bash
pnpm docker:verify:dev-host
pnpm docker:proxy:logs
```

---

## 5) Dev deploy to VPS (GitHub Actions + Infisical)

Workflow: `.github/workflows/cd.yml` (runs after Frontend CI succeeds on `main`, or manual dispatch)

Infisical:

- Project: `nestlancer-frontend` (`61ae088e-7cbb-47c5-9319-d1e0e2d8996f`)
- Environment slug: **`dev`**
- Machine identity: `github-actions-nestlancer-frontend-ui-dev`

Required GitHub secrets (repo **Settings → Secrets → Actions**):

| Secret                    | Purpose                      |
| :------------------------ | :--------------------------- |
| `INFISICAL_CLIENT_ID`     | Universal Auth client ID     |
| `INFISICAL_CLIENT_SECRET` | Universal Auth client secret |
| `VPS_HOST`                | Dev VPS SSH host             |
| `VPS_USERNAME`            | SSH user                     |
| `VPS_PASSWORD`            | SSH password                 |

Optional: `VPS_FRONTEND_DEPLOY_PATH` (default `/root/nestlancer-frontend`)

Verify identity locally:

```bash
INFISICAL_CLIENT_ID=... INFISICAL_CLIENT_SECRET=... \
  ./scripts/infisical/verify-export.sh dev
```

On VPS (one-time): install Infisical CLI, clone repo, ensure `.infisical.json` is present.

Deploy flow: push to `main` → CI passes → CD exports Infisical `dev` → `.env.infisical` → `docker compose -f docker-compose.dev.yml up -d`

See `docs/guides/infisical.md` for full setup.

---

## 6) Release frontend images to GHCR

Workflow file: `.github/workflows/build-images.yml`

Images:

- `frontend-web`
- `frontend-admin`
- `frontend-landing`

Release steps:

```bash
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0
```

Then:

1. publish GitHub release for `v1.0.0`
2. open Actions -> Build Production Images
3. wait until all jobs succeed

Expected:

- all 3 GHCR frontend images are available for the release tag

---

## 7) Production deploy to VPS (automatic workflow)

Workflow: `.github/workflows/cd-production.yml`

Required GitHub secrets:

- `PRODUCTION_VPS_HOST`
- `PRODUCTION_VPS_USERNAME`
- `PRODUCTION_VPS_PASSWORD`
- `PRODUCTION_VPS_FRONTEND_DEPLOY_PATH` (optional)
- `INFISICAL_CLIENT_ID`
- `INFISICAL_CLIENT_SECRET`
- `INFISICAL_PROJECT_ID` (optional)
- `NESTLANCER_IMAGE_REGISTRY`

---

## 8) Manual VPS deploy fallback

```bash
ssh root@YOUR_VPS_IP
cd /root/nestlancer-frontend

git pull origin main
echo "ghp_xxx" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

INFISICAL_ENV=prod ./scripts/docker/compose-prod.sh pull
INFISICAL_ENV=prod ./scripts/docker/compose-prod.sh up -d
./scripts/deploy/smoke-health.sh
```

Expected:

- GHCR login success
- compose services running
- smoke health checks pass

---

## 9) Rollback (production)

```bash
cd /root/nestlancer-frontend
COMPOSE_FILE=docker-compose.prod.yml ./scripts/deploy/rollback.sh <previous-sha>
pnpm docker:prod:ps
./scripts/deploy/smoke-health.sh
```

Expected:

- previous stable release restored
- smoke checks pass again

---

## 10) Day-2 operator runbook

### First 10-minute incident response

- [ ] identify impacted app (`web`, `admin`, `landing`, or all)
- [ ] check compose status
- [ ] inspect app logs
- [ ] verify upstream backend availability
- [ ] rollback if unresolved in 10-15 minutes

Commands:

```bash
cd /root/nestlancer-frontend
pnpm docker:prod:ps
pnpm docker:prod:logs
docker compose -f docker-compose.prod.yml logs -f --tail=200 web
```

Common root causes:

- wrong `NEXT_PUBLIC_*` values baked in image
- backend gateway unavailable
- domain/proxy misconfiguration

---

## 11) New VPS setup checklist (copy-paste)

```bash
ssh root@YOUR_VPS_IP

apt update
apt install -y git docker.io docker-compose-plugin curl ufw
systemctl enable docker
systemctl start docker

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Install Infisical CLI using official instructions for your OS
infisical --version

cd /root
git clone <frontend-repo-url> nestlancer-frontend

echo "ghp_xxx" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Then apply UFW Docker web rules and start dev frontend — [section 13](#13-dev-vps--public-frontend-dev-web--dev-admin--dev-landing).

Expected:

- prerequisites installed
- repo cloned
- GHCR login success
- provider firewall allows 80/443 (Hetzner Cloud Firewall if applicable)

---

## 12) Printable release checklist (frontend only)

- [ ] `main` branch ready
- [ ] tag created and pushed
- [ ] release published
- [ ] build-images workflow green
- [ ] cd-production workflow green
- [ ] smoke health checks green
- [ ] rollback SHA documented

---

## 13) Dev VPS — public frontend (`dev-web`, `dev-admin`, `dev-landing`)

Use this when the **dev** Docker stack runs on a VPS and teammates open the apps in a browser (not only `localhost`).

### What runs where

- On the **same VPS as the backend**, use one Caddy (`nl-dev-proxy` in the backend repo) for API + frontend hosts. `pnpm docker:up` in frontend auto-skips a second proxy when `nl-dev-proxy` is already running.
- Standalone frontend-only VPS: **Caddy** container `nl-frontend-dev-proxy` binds `80`/`443` (`docker-compose.local.yml`).
- Caddy proxies:
  - `dev-web.nestlancer.com` → `web:9000`
  - `dev-admin.nestlancer.com` → `admin:9010`
  - `dev-landing.nestlancer.com` → `landing:9020`
- **No host-level Nginx** is required for this dev path (legacy configs in `docker/nginx/` are optional fallback).

### One-time VPS setup

- [ ] DNS A records → **same VPS IPv4 as `dev-api.nestlancer.com`** (all dev hosts must match; a wrong IP breaks Let's Encrypt and HTTPS):
  - `dev-web.nestlancer.com`
  - `dev-admin.nestlancer.com`
  - `dev-landing.nestlancer.com`
- [ ] Provider firewall (e.g. Hetzner): inbound TCP `80`, `443` from anywhere
- [ ] UFW on VPS:
  ```bash
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw reload
  ```
- [ ] **UFW + Docker fix** (required when UFW is enabled):

  In `/etc/ufw/after.rules`, inside `# BEGIN UFW AND DOCKER`, add immediately after `-A DOCKER-USER -j ufw-user-forward`:

  ```text
  -A DOCKER-USER -p tcp -m tcp --dport 80 -j RETURN
  -A DOCKER-USER -p tcp -m tcp --dport 443 -j RETURN
  ```

  Then:

  ```bash
  ufw reload
  docker restart nl-frontend-dev-proxy
  ```

  **Why:** default rules can DROP forwarded traffic to Docker bridge networks, so ports `80`/`443` accept SYNs but never reach Caddy.

### Start and verify on VPS

```bash
cd /root/nestlancer-frontend   # or your clone path
export DEV_WEB_HOST=dev-web.nestlancer.com
export DEV_ADMIN_HOST=dev-admin.nestlancer.com
export DEV_LANDING_HOST=dev-landing.nestlancer.com
export LETSENCRYPT_EMAIL=ops@nestlancer.com
pnpm docker:up
# wait ~90s for Next.js dev compile, then:
pnpm docker:verify:dev-host
pnpm docker:proxy:logs
```

Ensure `docker-compose.dev.yml` points API proxy at your backend (e.g. `API_UPSTREAM=https://dev-api.nestlancer.com` once backend dev API is live).

### Verify from your laptop

```bash
curl -v --connect-timeout 10 https://dev-web.nestlancer.com/
curl -v --connect-timeout 10 https://dev-admin.nestlancer.com/
curl -v --connect-timeout 10 https://dev-landing.nestlancer.com/
```

Expected: valid TLS (Let's Encrypt) and HTTP `200`.

### If the browser times out

1. On VPS, run while you curl from laptop:
   ```bash
   sudo tcpdump -ni eth0 'tcp port 80 or tcp port 443'
   ```
2. If you see `SYN` from your IP but **no `SYN-ACK`**, fix UFW Docker rules (above) or provider firewall—not application code.
3. If local checks pass but public fails, do **not** trust VPS-only curls to the public IP (hairpin can work while external clients are blocked).

More detail: `README.md` → **Dev VPS Public Access**.
