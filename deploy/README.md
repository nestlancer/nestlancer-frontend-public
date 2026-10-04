<div align="center">

# Nestlancer frontend deployment (K3s)

</div>

---

## Layout

```
deploy/
├── README.md
└── k3s/
    ├── base/                 # namespace, ingress, workloads (generated)
    └── overlays/
        ├── production/
        └── staging/
```

---

## Container registry (GHCR)

| Surface      | Registry config                                                                                                    |
| :----------- | :----------------------------------------------------------------------------------------------------------------- |
| Compose prod | `NESTLANCER_IMAGE_REGISTRY` / `NESTLANCER_IMAGE_TAG` in `.env.production`                                          |
| CI build     | `.github/workflows/build-images.yml` → `ghcr.io/<owner>/frontend-{web,admin,landing}`                              |
| K3s          | `pnpm k3s:generate`; overlays remap org via `k8sImageRegistryOverride` in `scripts/docker/workloads.manifest.json` |

K3s clusters need `ghcr-credentials` in namespace `nestlancer-frontend` before workloads can pull private images.

## Quick paths

| Environment    | Method                                                                     |
| :------------- | :------------------------------------------------------------------------- |
| **Dev**        | `docker-compose.dev.yml` + `cd.yml` (build on VPS)                         |
| **Production** | GHCR images + `INFISICAL_ENV=production pnpm docker:prod:up`               |
| **K3s**        | `pnpm k3s:generate` then `kubectl apply -k deploy/k3s/overlays/production` |

---

## Docs

- [Production VPS deploy](../docs/operations/deployment-prod-vps.md)
