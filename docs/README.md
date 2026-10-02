<div align="center">

# Nestlancer Frontend — Documentation

### Maintenance notes: [DOCUMENTATION.md](DOCUMENTATION.md).

</div>

---

## 📖 Table of Contents

- [🚀 Start here](#start-here)
- [Applications](#applications)
- [Shared packages](#shared-packages)
- [API contract](#api-contract)
- [📘 Guides](#guides)
- [UX / design](#ux-design)
- [📋 Changelog](#changelog)
- [Maintaining docs](#maintaining-docs)
- [🗄 Archive](#archive)
- [Backend counterpart](#backend-counterpart)

---

## 🚀 Start here

| Document                                                 | Description                                   |
| :------------------------------------------------------- | :-------------------------------------------- |
| [Onboarding](guides/onboarding.md)                       | Day 1 setup with backend + frontend           |
| [Modification playbook](guides/modification-playbook.md) | Routes, features, Orval, testing              |
| [Architecture](architecture/ARCHITECTURE.md)             | Stack, auth, data fetching, realtime          |
| [Directory structure](architecture/dir-structure.md)     | Target monorepo layout (apps + packages)      |
| [Root README](../README.md)                              | Quick start, ports, Husky, OpenAPI codegen    |
| [Production deploy](guides/prod-deployment.md)           | GHCR, Compose, image build commands + timings |
| [Nginx + Docker dev](guides/nginx.md)                    | dev-web / dev-admin subdomains                |

---

## Applications

| App                          | Port | Doc                                                      |
| :--------------------------- | :--- | :------------------------------------------------------- |
| **web** — client product UI  | 9000 | [components/apps/web.md](components/apps/web.md)         |
| **admin** — operator console | 9010 | [components/apps/admin.md](components/apps/admin.md)     |
| **landing** — marketing site | 9020 | [components/apps/landing.md](components/apps/landing.md) |

---

## Shared packages

| Package    | Doc                                                |
| :--------- | :------------------------------------------------- |
| api-client | [api-client.md](components/packages/api-client.md) |
| ui         | [ui.md](components/packages/ui.md)                 |
| auth       | [auth.md](components/packages/auth.md)             |
| websocket  | [websocket.md](components/packages/websocket.md)   |
| types      | [types.md](components/packages/types.md)           |
| validators | [validators.md](components/packages/validators.md) |
| utils      | [utils.md](components/packages/utils.md)           |
| config     | [config.md](components/packages/config.md)         |
| constants  | [constants.md](components/packages/constants.md)   |
| hooks      | [hooks.md](components/packages/hooks.md)           |
| theme      | [theme.md](components/packages/theme.md)           |
| tokens     | [tokens.md](components/packages/tokens.md)         |
| motion     | [motion.md](components/packages/motion.md)         |
| marketing  | [marketing.md](components/packages/marketing.md)   |
| field-help | [field-help.md](components/packages/field-help.md) |

---

## API contract

| Resource      | Location                                                           |
| :------------ | :----------------------------------------------------------------- |
| OpenAPI specs | `swagger-docs/openapi-gateway.json` (refresh: `pnpm pull:openapi`) |
| Orval codegen | `packages/api-client/src/generated/`                               |
| Workflow      | [scripts/openapi/README.md](../scripts/openapi/README.md)          |

---

## 📘 Guides

| Guide                  | Doc                                                                                          |
| :--------------------- | :------------------------------------------------------------------------------------------- |
| Production deploy      | [guides/prod-deployment.md](guides/prod-deployment.md) — GHCR, Compose, `build:one`, timings |
| Production VPS / K3s   | [guides/production-vps-deploy.md](guides/production-vps-deploy.md)                           |
| Dev deploy             | [guides/dev-deployment.md](guides/dev-deployment.md)                                         |
| Environment variables  | [guides/environment-variables.md](guides/environment-variables.md)                           |
| Infisical              | [guides/infisical.md](guides/infisical.md)                                                   |
| Container logging      | [guides/logging.md](guides/logging.md) — `pnpm docker:prod:logs`, JSON events                |
| Web Push testing       | [guides/web-push-testing.md](guides/web-push-testing.md)                                     |
| Razorpay test payments | [guides/razorpay-test-payments.md](guides/razorpay-test-payments.md)                         |
| Nginx setup            | [guides/nginx.md](guides/nginx.md)                                                           |
| Troubleshooting        | [guides/troubleshooting.md](guides/troubleshooting.md)                                       |

---

## UX / design

Wireframes for public, user dashboard, and admin flows:

- [architecture/diagrams/wireframes/](architecture/diagrams/wireframes/README.md)

---

## 📋 Changelog

- [**CHANGELOG.md**](changelog/CHANGELOG.md) — from git history (`node scripts/generate-changelog.mjs`)

---

## Maintaining docs

| Task                         | Command                                   |
| :--------------------------- | :---------------------------------------- |
| Regenerate app/package pages | `node scripts/generate-frontend-docs.mjs` |
| Regenerate changelog         | `node scripts/generate-changelog.mjs`     |

---

## 🗄 Archive

Historical migration plans and implementation tracker: [archive/](archive/).

---

## Backend counterpart

Server documentation: `nestlancer-backend-api/docs/README.md`
