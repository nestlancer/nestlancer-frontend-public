# API contract (frontend)

The frontend does **not** own the OpenAPI source of truth. The gateway merged spec lives in the backend; this repo mirrors it and generates the TypeScript client.

| Step                  | Command                    | Notes                                          |
| :-------------------- | :------------------------- | :--------------------------------------------- |
| Pull gateway OpenAPI  | `pnpm pull:openapi`        | Writes `swagger-docs/openapi-gateway.json`     |
| Generate Orval client | `pnpm codegen`             | Output: `packages/api-client/src/generated/**` |
| Lint OpenAPI          | `pnpm openapi:lint`        | Spectral                                       |
| Drift check           | `pnpm api:drift-check:all` | Service-level drift helpers                    |
| Full contract gate    | `pnpm contract:check`      | codegen check + lint                           |

**Never hand-edit** `packages/api-client/src/generated/**`. Details: [`scripts/openapi/README.md`](../../scripts/openapi/README.md).
