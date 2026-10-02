# syntax=docker/dockerfile:1
# Shared frontend monorepo build — one pnpm install, three next builds, thin standalone runtimes.
#
# Dev image: compilers + full workspace install, no Next compile (~same wall clock as a naive
# prod path). Prod must install once, compile three apps in one graph, and ship alpine
# runtimes without python/make/g++.
#
# Usage:
#   docker buildx bake -f docker/prod-monorepo.bake.hcl --load all-runtime

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
# Native addons (sharp, etc.) only in the install stage — never in the runtime image.
RUN apk add --no-cache python3 make g++
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY apps/landing/package.json ./apps/landing/
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

FROM deps AS monorepo-builder
ENV NODE_OPTIONS=--max-old-space-size=2048

COPY apps ./apps
COPY packages ./packages

ARG WEB_NEXT_PUBLIC_API_URL=https://app.nestlancer.com
ARG WEB_NEXT_PUBLIC_APP_URL=https://app.nestlancer.com
ARG ADMIN_NEXT_PUBLIC_API_URL=https://admin.nestlancer.com
ARG ADMIN_NEXT_PUBLIC_APP_URL=https://app.nestlancer.com
ARG ADMIN_NEXT_PUBLIC_ADMIN_APP_URL=https://admin.nestlancer.com
ARG LANDING_NEXT_PUBLIC_API_URL=https://landing.nestlancer.com
ARG LANDING_NEXT_PUBLIC_APP_URL=https://app.nestlancer.com
ARG LANDING_NEXT_PUBLIC_LANDING_URL=https://nestlancer.com
ARG NEXT_PUBLIC_WS_URL=https://api.nestlancer.com
ARG NEXT_PUBLIC_SOCKET_IO_PATH=/ws/socket.io
ARG NEXT_PUBLIC_API_PROXY=true
ARG NEXT_PUBLIC_AUTH_REFRESH_BFF=true
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=
ARG NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ARG NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN=
ARG API_UPSTREAM=https://api.nestlancer.com

# Shared public env for all three apps (per-app API/APP URLs are set per RUN).
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_SOCKET_IO_PATH=$NEXT_PUBLIC_SOCKET_IO_PATH \
    NEXT_PUBLIC_API_PROXY=$NEXT_PUBLIC_API_PROXY \
    NEXT_PUBLIC_AUTH_REFRESH_BFF=$NEXT_PUBLIC_AUTH_REFRESH_BFF \
    NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID \
    NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=$NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN=$NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN \
    API_UPSTREAM=$API_UPSTREAM \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# When set (e.g. frontend-web), only that app is compiled — used by docker:prod:build:one.
ARG NESTLANCER_BUILD_TARGET=""
ENV NESTLANCER_BUILD_TARGET=$NESTLANCER_BUILD_TARGET

RUN --mount=type=cache,id=fe-next-web,target=/app/apps/web/.next/cache \
    if [ -z "$NESTLANCER_BUILD_TARGET" ] || [ "$NESTLANCER_BUILD_TARGET" = "frontend-web" ]; then \
      NEXT_PUBLIC_API_URL="$WEB_NEXT_PUBLIC_API_URL" \
      NEXT_PUBLIC_APP_URL="$WEB_NEXT_PUBLIC_APP_URL" \
      NEXT_PUBLIC_LANDING_URL="$LANDING_NEXT_PUBLIC_LANDING_URL" \
      NEXT_PUBLIC_ADMIN_APP_URL="$ADMIN_NEXT_PUBLIC_ADMIN_APP_URL" \
      pnpm --filter @nestlancer/web build; \
    else \
      echo "skip @nestlancer/web (NESTLANCER_BUILD_TARGET=${NESTLANCER_BUILD_TARGET})"; \
    fi

RUN --mount=type=cache,id=fe-next-admin,target=/app/apps/admin/.next/cache \
    if [ -z "$NESTLANCER_BUILD_TARGET" ] || [ "$NESTLANCER_BUILD_TARGET" = "frontend-admin" ]; then \
      NEXT_PUBLIC_API_URL="$ADMIN_NEXT_PUBLIC_API_URL" \
      NEXT_PUBLIC_APP_URL="$ADMIN_NEXT_PUBLIC_APP_URL" \
      NEXT_PUBLIC_LANDING_URL="$LANDING_NEXT_PUBLIC_LANDING_URL" \
      NEXT_PUBLIC_ADMIN_APP_URL="$ADMIN_NEXT_PUBLIC_ADMIN_APP_URL" \
      pnpm --filter @nestlancer/admin build; \
    else \
      echo "skip @nestlancer/admin (NESTLANCER_BUILD_TARGET=${NESTLANCER_BUILD_TARGET})"; \
    fi

RUN --mount=type=cache,id=fe-next-landing,target=/app/apps/landing/.next/cache \
    if [ -z "$NESTLANCER_BUILD_TARGET" ] || [ "$NESTLANCER_BUILD_TARGET" = "frontend-landing" ]; then \
      NEXT_PUBLIC_API_URL="$LANDING_NEXT_PUBLIC_API_URL" \
      NEXT_PUBLIC_APP_URL="$LANDING_NEXT_PUBLIC_APP_URL" \
      NEXT_PUBLIC_LANDING_URL="$LANDING_NEXT_PUBLIC_LANDING_URL" \
      NEXT_PUBLIC_ADMIN_APP_URL="$ADMIN_NEXT_PUBLIC_ADMIN_APP_URL" \
      pnpm --filter @nestlancer/landing build; \
    else \
      echo "skip @nestlancer/landing (NESTLANCER_BUILD_TARGET=${NESTLANCER_BUILD_TARGET})"; \
    fi

FROM node:20-alpine AS runtime-base
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=384 \
    NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

FROM runtime-base AS frontend-web
ARG APP_PORT=9000
ENV PORT=${APP_PORT} HOSTNAME=0.0.0.0
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static.__new
RUN rm -rf ./apps/web/.next/static && mv ./apps/web/.next/static.__new ./apps/web/.next/static
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE ${APP_PORT}
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -sf "http://127.0.0.1:${APP_PORT}/" || exit 1
CMD ["node", "apps/web/server.js"]

FROM runtime-base AS frontend-admin
ARG APP_PORT=9010
ENV PORT=${APP_PORT} HOSTNAME=0.0.0.0
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/admin/.next/standalone ./
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/admin/.next/static ./apps/admin/.next/static.__new
RUN rm -rf ./apps/admin/.next/static && mv ./apps/admin/.next/static.__new ./apps/admin/.next/static
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/admin/public ./apps/admin/public
USER nextjs
EXPOSE ${APP_PORT}
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -sf "http://127.0.0.1:${APP_PORT}/" || exit 1
CMD ["node", "apps/admin/server.js"]

FROM runtime-base AS frontend-landing
ARG APP_PORT=9020
ENV PORT=${APP_PORT} HOSTNAME=0.0.0.0
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/landing/.next/standalone ./
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/landing/.next/static ./apps/landing/.next/static.__new
RUN rm -rf ./apps/landing/.next/static && mv ./apps/landing/.next/static.__new ./apps/landing/.next/static
COPY --from=monorepo-builder --chown=nextjs:nextjs /app/apps/landing/public ./apps/landing/public
USER nextjs
EXPOSE ${APP_PORT}
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -sf "http://127.0.0.1:${APP_PORT}/" || exit 1
CMD ["node", "apps/landing/server.js"]
