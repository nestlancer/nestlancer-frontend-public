# @nestlancer/api-client

Typed HTTP access to the gateway OpenAPI contract.

## Package info

|            |                                               |
| ---------- | --------------------------------------------- |
| **Path**   | `packages/api-client/`                        |
| **Import** | `import { … } from '@nestlancer/api-client';` |

## Workspace dependencies

- `@nestlancer/auth`
- `@nestlancer/config`
- `@nestlancer/types`
- `@nestlancer/utils`

## Architecture

```
swagger-docs/openapi-gateway.json
        → Orval (orval.config.ts)
        → src/generated/     # Axios functions (all tags)
        → src/generated/react-query/  # Hooks (blog pilot)
        → src/services/      # Hand-written facades for other domains
        → src/interceptors/  # auth, errors, retry
```

## Regenerating the client

```bash
pnpm pull:openapi    # GET https://dev.nestlancer.com/docs-all-json
pnpm codegen
pnpm contract:check  # pre-push: drift + Spectral
```

**Never hand-edit** `src/generated/**`.

## Response envelope

Gateway returns `{ status, message, data, metadata }`. Interceptors unwrap `data` for callers.

## Consumers

- `apps/web`, `apps/admin` feature hooks
- Prefer feature-level hooks over calling generated functions directly in pages

## Related documentation

- [Frontend architecture](../../architecture/overview.md)
- [CHANGELOG](../../changelog/CHANGELOG.md)
