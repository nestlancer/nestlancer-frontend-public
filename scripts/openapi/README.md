<div align="center">

# OpenAPI

### Contract-first client generation from the gateway merged spec.

</div>

---

## 📖 Table of Contents

- [Workflow](#workflow)
- [⌨ Scripts](#scripts)
- [Intentional runtime pieces (not hacks)](#intentional-runtime-pieces-not-hacks)
- [React Query (generated hooks)](#react-query-generated-hooks)
- [Backend companion scripts](#backend-companion-scripts)

---

## Workflow

1. **Backend** must be running with a fresh merged spec. Pull URL is resolved from `OPENAPI_URL`, `OPENAPI_GATEWAY_URL`, or `API_UPSTREAM` in `.env.development` / `.env.production` (defaults: `dev-api` / `api.nestlancer.com`). Falls back to `http://127.0.0.1:3000/docs-all-json` when the gateway is local. Override: `OPENAPI_URL=http://127.0.0.1:3000/docs-all-json pnpm pull:openapi`.
2. **Pull + codegen**: `pnpm openapi:refresh` (pull spec, Orval, post-orval barrel).
3. **Local / CI parity**: `pnpm contract:check` (`codegen:check` + Spectral) or `pnpm codegen:check` alone.
4. **Pre-push**: Husky runs `pnpm contract:check` (skip GitHub Actions if not used).
5. **Hand-written services**: `pnpm api:drift-check:all` — paths in `packages/api-client/src/services/*.service.ts` must exist in the spec.

---

## ⌨ Scripts

| Script                           | Purpose                                                                   |
| :------------------------------- | :------------------------------------------------------------------------ |
| `pull-openapi.sh`                | Downloads `swagger-docs/openapi-gateway.json` + normalizes for Spectral   |
| `normalize-openapi-document.mjs` | Same normalization as backend (regex patterns, nested `required`)         |
| `post-orval.mjs`                 | Writes `generated/index.ts` barrel (Orval `tags-split` does not emit one) |
| `check-service-drift.mjs`        | Compares hand-written service URLs to the spec                            |

---

## Intentional runtime pieces (not hacks)

- **`orval-mutator.ts`** — strips duplicate `/api/v1` (spec paths are absolute; Axios `baseURL` already ends with `/api/v1`).
- **`envelope.interceptor.ts`** — unwraps `{ status: 'success', data, metadata }` at runtime. Generated types include the envelope; apps using the hand-written client still unwrap via this interceptor.

---

## React Query (generated hooks)

- **Axios factories**: `packages/api-client/src/generated/` (all tags)
- **Query hooks**: `packages/api-client/src/generated/react-query/` — tags: **blog**, **auth**, **requests**
- **App usage**: import generated hooks from `@nestlancer/api-client` (e.g. `useAuthAuthPublicControllerLogin`, `useGatewayBlogControllerSearchPosts`); SSR helpers: `listBlogPosts`

Add tags in `REACT_QUERY_TAGS` in `orval.config.ts`, then `pnpm openapi:refresh`.

---

## Backend companion scripts

In `nestlancer-backend-api`:

- `pnpm openapi:gateway-params` — ensure `@ApiParam` on gateway proxy routes
- `pnpm openapi:export` — save live `/docs-all-json` to `docs/api/openapi-merged.json`
- `pnpm openapi:lint:merged` — export + Spectral lint
