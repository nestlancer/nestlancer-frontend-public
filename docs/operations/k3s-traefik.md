# K3s, Traefik, and cert-manager (frontend)

Domains per app are in `scripts/docker/workloads.manifest.json` under `environments`. Regenerate manifests with `pnpm k3s:generate`.

## Hosts

| Overlay    | Web                    | Admin                    | Landing                    |
| ---------- | ---------------------- | ------------------------ | -------------------------- |
| dev        | dev-web.nestlancer.com | dev-admin.nestlancer.com | dev-landing.nestlancer.com |
| production | app.nestlancer.com     | admin.nestlancer.com     | www.nestlancer.com         |

## Deploy

```bash
infisical export --env=dev --format=dotenv --projectId="$PROJECT_ID" > .env.infisical
./scripts/deploy/k3s-deploy.sh dev
```

## Local test

```bash
pnpm k3s:validate
pnpm k3s:local:test
```

Hosts file for local overlay:

```
127.0.0.1 app.nestlancer.local admin.nestlancer.local www.nestlancer.local
```

ClusterIssuer is installed once from the **backend** repo (`deploy/k3s/base/cert-manager`).
