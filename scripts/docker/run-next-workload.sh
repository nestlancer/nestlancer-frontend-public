#!/bin/sh
# Hybrid Next.js runner for docker-compose.dev.yml
# Usage: run-next-workload.sh <compose-service> <pnpm-filter> <port>
#
# WATCH_APPS=web,admin,landing (24GB default) → all apps use `next dev`
# (HMR / watch). A comma list enables focused watch; non-watch apps build once.
#
# Polling (CPU-heavy) is OFF by default on Linux bind mounts. Opt in only if
# native FS events miss changes (e.g. Docker Desktop on macOS/Windows):
#   WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true
set -eu

COMPOSE_SVC="${1:?compose service name required}"
PNPM_FILTER="${2:?pnpm filter required}"
PORT="${3:?port required}"

WATCH_APPS="${WATCH_APPS:-web,admin,landing}"

should_watch=0
old_ifs=$IFS
IFS=','
for item in $WATCH_APPS; do
  item=$(printf '%s' "$item" | tr -d ' ')
  if [ "$item" = "$COMPOSE_SVC" ]; then
    should_watch=1
    break
  fi
done
IFS=$old_ifs

cd /app

# Resolve app directory from filter (@nestlancer/web → apps/web)
APP_DIR=""
case "$PNPM_FILTER" in
  @nestlancer/web) APP_DIR=apps/web ;;
  @nestlancer/admin) APP_DIR=apps/admin ;;
  @nestlancer/landing) APP_DIR=apps/landing ;;
  *)
    echo "ERROR: unknown filter '$PNPM_FILTER'" >&2
    exit 1
    ;;
esac

if [ "$should_watch" -eq 1 ]; then
  echo "[next-workload] ${COMPOSE_SVC}: WATCH → next dev -p ${PORT}"
  # First compile of a large app needs ≥1.5GB heap; leave headroom under mem_limit.
  export NODE_OPTIONS="${NODE_OPTIONS_WATCH:-${NODE_OPTIONS:---max-old-space-size=2048}}"
  # Next.js restarts the dev worker near heap limit; that invalidates chunk URLs (blank pages).
  export __NEXT_DISABLE_MEMORY_WATCHER="${__NEXT_DISABLE_MEMORY_WATCHER:-1}"
  # Prefer inotify on Linux VPS; polling burns CPU on 6-core hosts.
  export WATCHPACK_POLLING="${WATCHPACK_POLLING:-false}"
  export CHOKIDAR_USEPOLLING="${CHOKIDAR_USEPOLLING:-false}"
  export WATCHPACK_POLLING_INTERVAL="${WATCHPACK_POLLING_INTERVAL:-2000}"
  exec pnpm --filter "$PNPM_FILTER" exec next dev -p "$PORT" -H 0.0.0.0
fi

echo "[next-workload] ${COMPOSE_SVC}: NON-WATCH → next build (if needed) + next start"

# Infisical often sets NODE_ENV=development — next start requires production.
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS_BUILD:---max-old-space-size=1536}"

# A usable production .next needs BOTH files. Incomplete/corrupt builds
# (e.g. interrupted build, leftover next-dev artifacts) must be rebuilt.
prod_build_ok=0
if [ -f "${APP_DIR}/.next/required-server-files.json" ] \
  && [ -f "${APP_DIR}/.next/prerender-manifest.json" ]; then
  prod_build_ok=1
fi

if [ "$prod_build_ok" -eq 1 ]; then
  echo "[next-workload] ${APP_DIR}/.next production build present — skip build"
else
  echo "[next-workload] rebuilding ${APP_DIR}/.next (missing or incomplete production build)..."
  # .next is often a Docker volume mount — cannot rmdir the mountpoint; clear contents.
  if [ -d "${APP_DIR}/.next" ]; then
    find "${APP_DIR}/.next" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  else
    mkdir -p "${APP_DIR}/.next"
  fi
  pnpm --filter "$PNPM_FILTER" build
fi

if [ ! -f "${APP_DIR}/.next/prerender-manifest.json" ]; then
  echo "ERROR: ${APP_DIR}/.next/prerender-manifest.json missing after build" >&2
  exit 1
fi

export NODE_OPTIONS="${NODE_OPTIONS_RUNTIME:---max-old-space-size=512}"
exec pnpm --filter "$PNPM_FILTER" exec next start -p "$PORT" -H 0.0.0.0
