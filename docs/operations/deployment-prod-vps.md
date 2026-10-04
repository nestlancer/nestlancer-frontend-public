<div align="center">

# Frontend production deployment

</div>

---

## Path A — K3s

### 1. Build and push images (GHCR)

On release tags, `.github/workflows/build-images.yml` pushes:

- `ghcr.io/<github-org>/frontend-web:<tag>`
- `ghcr.io/<github-org>/frontend-admin:<tag>`
- `ghcr.io/<github-org>/frontend-landing:<tag>`

Manual build:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
export NESTLANCER_IMAGE_REGISTRY=ghcr.io/your-org
export NESTLANCER_IMAGE_TAG=latest
pnpm docker:prod:build:one frontend-web   # scopes Next compile to web only
# Or all three: pnpm docker:prod:build
docker push "${NESTLANCER_IMAGE_REGISTRY}/frontend-web:${NESTLANCER_IMAGE_TAG}"
```

Keep `.cache/docker-buildkit` between runs. See [prod-deployment.md](./prod-deployment.md) for timings and safe cleanup.

Set `k8sImageRegistryOverride` in `scripts/docker/workloads.manifest.json`, run `pnpm k3s:generate`, then apply:

```bash
kubectl create secret docker-registry ghcr-credentials -n nestlancer-frontend \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USER \
  --docker-password=ghp_xxx

infisical export --env=production --format=dotenv --projectId="$PROJECT_ID" > .env.production
kubectl create secret generic nestlancer-frontend-secrets -n nestlancer-frontend \
  --from-env-file=.env.production --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -k deploy/k3s/overlays/production
```

---

## Path B — Docker Compose production (single VPS)

Used by `.github/workflows/cd-production.yml` on version tags:

1. Build or pull GHCR images (`build-images.yml` phased bake, or `pnpm docker:prod:build` locally)
2. Infisical env slug **`prod`** → `.env.infisical` via `scripts/docker/compose-prod.sh`
3. `pnpm docker:prod:up`
4. Smoke: `./scripts/deploy/smoke-health.sh`

Local helpers (progress bar + ETA). Prefer **one app** while iterating — and **do not** wipe BuildKit cache:

```bash
pnpm docker:prod:build:one frontend-web                   # one app (skips other Next compiles)
./scripts/docker/build-group-prod-images.sh frontend-builder
pnpm docker:prod:build                                    # all three (cold ~30–50 min)
```

Full guide: [prod-deployment.md](./prod-deployment.md).

---

## Path C — Local production containers (no registry)

```bash
infisical export --env=prod --format=dotenv > .env.infisical
pnpm docker:prod:local:start
```

Uses `docker-compose.prod.local.yml` with Infisical via `scripts/docker/compose-prod-local.sh` (builds on your machine).

---

## Rollback

```bash
COMPOSE_FILE=docker-compose.prod.yml ./scripts/deploy/rollback.sh <sha>
```

---

## Health checks

```bash
./scripts/deploy/smoke-health.sh
# or
WEB_URL=https://app.nestlancer.com ADMIN_URL=https://admin.nestlancer.com ./scripts/deploy/smoke-health.sh
```
