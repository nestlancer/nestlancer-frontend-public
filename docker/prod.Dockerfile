# Nestlancer frontend — production image (legacy single-app build).
# Prefer docker/prod-monorepo.Dockerfile via scripts/docker/build-all-prod-images.sh
# or docker-compose.prod.local.yml (shared install + three Next compiles).

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS builder
# Compilers stay in the builder. Runtime is a clean alpine image.
RUN apk add --no-cache python3 make g++ curl

ENV NODE_OPTIONS=--max-old-space-size=2048

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

RUN --mount=type=cache,id=fe-pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch --frozen-lockfile && \
    pnpm install --frozen-lockfile --offline

COPY apps ./apps
COPY packages ./packages

ARG APP_FILTER=@nestlancer/web
ARG APP_PORT=9000
ARG APP_DIR=web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_SOCKET_IO_PATH=/ws/socket.io
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ADMIN_APP_URL
ARG NEXT_PUBLIC_API_PROXY=false
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=
ARG NEXT_PUBLIC_AUTH_REFRESH_BFF=true
ARG NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=
ARG API_UPSTREAM=https://api.nestlancer.com

ENV NODE_ENV=production \
    APP_FILTER=${APP_FILTER} \
    APP_PORT=${APP_PORT} \
    APP_DIR=${APP_DIR} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL} \
    NEXT_PUBLIC_SOCKET_IO_PATH=${NEXT_PUBLIC_SOCKET_IO_PATH} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_ADMIN_APP_URL=${NEXT_PUBLIC_ADMIN_APP_URL} \
    NEXT_PUBLIC_API_PROXY=${NEXT_PUBLIC_API_PROXY} \
    NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID} \
    NEXT_PUBLIC_AUTH_REFRESH_BFF=${NEXT_PUBLIC_AUTH_REFRESH_BFF} \
    NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=${NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY} \
    API_UPSTREAM=${API_UPSTREAM}

RUN --mount=type=cache,id=fe-next-${APP_DIR},target=/app/apps/${APP_DIR}/.next/cache \
    pnpm --filter "${APP_FILTER}" build

FROM node:20-alpine AS runner
RUN apk add --no-cache curl

ARG APP_FILTER=@nestlancer/web
ARG APP_PORT=9000
ARG APP_DIR=web

ENV NODE_ENV=production \
    PORT=${APP_PORT} \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=384 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nextjs /app/apps/${APP_DIR}/.next/standalone ./
# Copy to a staging path then replace — avoids nested `.next/static/static` when
# standalone already contains a `.next/static` directory (NL-BUG-DEPLOY-01/03).
COPY --from=builder --chown=nextjs:nextjs /app/apps/${APP_DIR}/.next/static ./apps/${APP_DIR}/.next/static.__new
RUN rm -rf ./apps/${APP_DIR}/.next/static && mv ./apps/${APP_DIR}/.next/static.__new ./apps/${APP_DIR}/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/${APP_DIR}/public ./apps/${APP_DIR}/public

USER nextjs

EXPOSE ${APP_PORT}

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -sf "http://127.0.0.1:${APP_PORT}/" || exit 1

CMD ["sh", "-c", "node apps/${APP_DIR}/server.js"]
