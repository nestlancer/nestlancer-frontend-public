# Nestlancer frontend — shared dev image (bind-mounted source at runtime).
# Usage:
#   docker compose -f docker-compose.dev.yml build
#   docker compose -f docker-compose.dev.yml up -d
#
# Tuned for 6c/12GB VPS: install uses capped Node heap; runtime limits live in compose.

FROM node:20-alpine

RUN apk add --no-cache python3 make g++ curl

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Cap install/build heap so image builds do not thrash the host.
ENV NODE_OPTIONS=--max-old-space-size=2048 \
    NEXT_TELEMETRY_DISABLED=1

COPY pnpm-workspace.yaml \
     pnpm-lock.yaml \
     package.json \
     turbo.json \
     tsconfig.json \
     ./

COPY apps/web/package.json ./apps/web/
COPY apps/landing/package.json ./apps/landing/
COPY apps/admin/package.json ./apps/admin/

COPY packages/api-client/package.json ./packages/api-client/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/constants/package.json ./packages/constants/
COPY packages/field-help/package.json ./packages/field-help/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/theme/package.json ./packages/theme/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validators/package.json ./packages/validators/
COPY packages/websocket/package.json ./packages/websocket/

RUN pnpm install --frozen-lockfile

CMD ["echo", "Use docker-compose.dev.yml — this image is a base only"]
