> **Deprecated for VPS deploy.** Use [K3s + Traefik](./k3s-traefik.md). Nginx configs in `docker/nginx/` are for Compose fallback only.

<div align="center">

# Nestlancer Frontend — Dev Docker + Nginx Setup Guide

</div>

---

## 📖 Table of Contents

- [1) Docker watch-mode command from `package.json`](#1-docker-watch-mode-command-from-packagejson)
- [2) Deploy dev containers / processes](#2-deploy-dev-containers-processes)
- [3) Install Nginx](#3-install-nginx)
- [4) Configure Nginx for all three subdomains](#4-configure-nginx-for-all-three-subdomains)
- [5) Firewall setup (UFW)](#5-firewall-setup-ufw)
- [6) DNS and runtime verification](#6-dns-and-runtime-verification)
- [7) Razorpay test payments (dev)](#7-razorpay-test-payments-dev)
- [8) Environment variables (browser → API and public app URLs)](#8-environment-variables-browser-api-and-public-app-urls)
- [9) What to validate on the server](#9-what-to-validate-on-the-server)

---

## 1) Docker watch-mode command from `package.json`

Align with the backend repo pattern:

- `pnpm docker:start` → `pnpm docker:build` then `pnpm docker:up`
- `pnpm docker:build` → `docker compose -f docker-compose.dev.yml build`
- `pnpm docker:up` → `docker compose -f docker-compose.dev.yml up -d`

The compose file starts **web** (`next dev -p 9000`) and **admin** (`next dev -p 9010`), for example:

- `pnpm --filter @nestlancer/web dev` / `next dev -p 9000 -H 0.0.0.0`
- `pnpm --filter @nestlancer/admin dev` / `next dev -p 9010 -H 0.0.0.0`

**Landing** is not in `docker-compose.dev.yml` yet. On the host (or an extra compose service), run it so something listens on **9020**, for example:

```bash
pnpm --filter @nestlancer/landing dev
```

**Port mapping:** ensure compose publishes **9000** (web) and **9010** (admin) to the host so Nginx can use `proxy_pass http://127.0.0.1:9000` and `:9010`. Landing must listen on the host at **9020** (or adjust the vhost `proxy_pass` port).

**API / CORS:** `docker-compose.dev.yml` sets `NEXT_PUBLIC_API_URL` to each app’s public origin (`https://dev-web…` / `https://dev-admin…`) plus `NEXT_PUBLIC_API_PROXY=true` and `API_UPSTREAM=https://dev.nestlancer.com`. The browser calls same-origin `/api/v1/*`; Next rewrites to the gateway, so you do not rely on gateway CORS for REST from these hosts.

---

## 2) Deploy dev containers / processes

From the **frontend** project root:

```bash
pnpm docker:start   # web in Docker, if that is your workflow
```

Useful checks:

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f --tail=100
```

---

## 3) Install Nginx

```bash
apt-get update
apt-get install -y nginx
```

---

## 4) Configure Nginx for all three subdomains

Ready-to-copy vhosts live in the repo:

- `docker/nginx/dev-web.nestlancer.com.conf` → `127.0.0.1:9000`
- `docker/nginx/dev-admin.nestlancer.com.conf` → `127.0.0.1:9010`
- `docker/nginx/dev-landing.nestlancer.com.conf` → `127.0.0.1:9020`

Install on the host from the frontend repo root:

```bash
sudo cp docker/nginx/dev-web.nestlancer.com.conf /etc/nginx/sites-available/dev-web.nestlancer.com
sudo cp docker/nginx/dev-admin.nestlancer.com.conf /etc/nginx/sites-available/dev-admin.nestlancer.com
sudo cp docker/nginx/dev-landing.nestlancer.com.conf /etc/nginx/sites-available/dev-landing.nestlancer.com
```

Each config sets WebSocket headers for Next.js dev HMR.

Enable + validate + reload:

```bash
sudo ln -sfn /etc/nginx/sites-available/dev-web.nestlancer.com /etc/nginx/sites-enabled/dev-web.nestlancer.com
sudo ln -sfn /etc/nginx/sites-available/dev-admin.nestlancer.com /etc/nginx/sites-enabled/dev-admin.nestlancer.com
sudo ln -sfn /etc/nginx/sites-available/dev-landing.nestlancer.com /etc/nginx/sites-enabled/dev-landing.nestlancer.com
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl is-active nginx
```

---

## 5) Firewall setup (UFW)

Allow Nginx traffic:

```bash
ufw allow 'Nginx Full'
ufw reload
ufw status
```

---

## 6) DNS and runtime verification

Verify DNS (add `A` records for `dev-web`, `dev-admin`, and `dev-landing` pointing at your server):

```bash
getent hosts dev-web.nestlancer.com
getent hosts dev-admin.nestlancer.com
getent hosts dev-landing.nestlancer.com
```

Verify Nginx vhost routing locally:

```bash
curl -I -H 'Host: dev-web.nestlancer.com' http://127.0.0.1/
curl -I -H 'Host: dev-admin.nestlancer.com' http://127.0.0.1/
curl -I -H 'Host: dev-landing.nestlancer.com' http://127.0.0.1/
```

Public checks:

```bash
curl -I http://dev-web.nestlancer.com/
curl -I http://dev-admin.nestlancer.com/
curl -I http://dev-landing.nestlancer.com/
```

Expected:

- HTTP `200` or `307`/`308` (redirect) on `/` when the matching Next process is up — not `502` from Nginx.

---

## 7) Razorpay test payments (dev)

When testing milestone checkout, use Razorpay **test mode** only. Full card/UPI numbers, Success vs Failure flow, and what happens to project status after pay:

- [Razorpay test payments](./razorpay-test-payments.md)

**Quick:** Card `4111 1111 1111 1111`, expiry `12/30`, CVV `123` → on Razorpay test page click **Success**. Or UPI `success@razorpay`.

---

## 8) Environment variables (browser → API and public app URLs)

Edit **`.env.development`** at the repo root (loaded by `docker-compose.dev.yml`). Per-service API proxy overrides are in the compose file for `web` and `admin`.

When apps are served under these hostnames, set public origins so links and auth boundaries match (see `packages/constants/src/app-urls.ts`):

- `NEXT_PUBLIC_API_URL` — compose sets `https://dev-web…` / `https://dev-admin…` with `NEXT_PUBLIC_API_PROXY=true`; gateway upstream is `API_UPSTREAM=https://dev.nestlancer.com`.
- `NEXT_PUBLIC_WS_URL` — WebSocket base URL for the client, aligned with your API/ws deployment.
- `NEXT_PUBLIC_APP_URL` — e.g. `https://dev-web.nestlancer.com` (main client app).
- `NEXT_PUBLIC_ADMIN_APP_URL` — e.g. `https://dev-admin.nestlancer.com` (operator console).

Landing uses `NEXT_PUBLIC_APP_URL` to link into the web app; set it to the **web** subdomain URL.

Rebuild or restart containers after changing `NEXT_PUBLIC_*` values (`pnpm docker:restart`).

---

## 9) What to validate on the server

- Frontend processes (or containers) listen on **9000**, **9010**, and **9020** on the host (or adjust vhosts).
- Nginx was installed and `nginx -t` succeeds after enabling the three sites.
- UFW allows Nginx traffic.
- All three hostnames resolve and return a Next response (not `502`).
- Dev HMR works in the browser (configs include `Upgrade` / `Connection` headers).

---

<div align="center">

**Nestlancer Frontend — Dev Docker + Nginx Setup Guide** — Nestlancer guide

</div>
