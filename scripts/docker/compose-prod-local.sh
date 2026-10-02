#!/usr/bin/env bash
# Local production-mode Docker (build on this machine, no GHCR pull).
# Infisical → .env.infisical. `build` uses the shared monorepo bake (not 3x legacy Dockerfile).
#
# Usage:
#   ./scripts/docker/compose-prod-local.sh build
#   ./scripts/docker/compose-prod-local.sh up -d
#   INFISICAL_ENV=dev ./scripts/docker/compose-prod-local.sh up -d

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.local.yml"
INFISICAL_ENV="${INFISICAL_ENV:-prod}"
ENV_FILE="${INFISICAL_ENV_FILE:-.env.infisical}"

# shellcheck source=ensure-infisical-env.sh
source "$ROOT/scripts/docker/ensure-infisical-env.sh"

needs_env_file() {
  case "${1:-}" in
    up | start | restart | run | create | build) return 0 ;;
    *) return 1 ;;
  esac
}

if [ $# -eq 0 ]; then
  echo "Usage: $0 <docker compose args...>" >&2
  exit 1
fi

if needs_env_file "$1"; then
  ensure_infisical_env_file
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "WARN: $ENV_FILE missing — build/run may fail; export Infisical or copy .env.production" >&2
fi

# Do NOT default NEXT_PUBLIC_*_APP_URL to localhost — that bakes dead marketing
# redirects and sitemap locs into the image (audit NL-BUG-CMS-001 / CMS-002).
# Bake resolves WEB_*/LANDING_*/ADMIN_* from Infisical + workloads.manifest.json.
# Optional env exports above still win when explicitly set.
export NEXT_PUBLIC_API_PROXY="${NEXT_PUBLIC_API_PROXY:-true}"
export API_UPSTREAM="${API_UPSTREAM:-http://host.docker.internal:4000}"

if [ "$1" = "build" ]; then
  # shellcheck source=_build-common.sh
  source "$ROOT/scripts/docker/_build-common.sh"
  echo "==> Local prod images via shared monorepo bake (not 3 independent installs)..."
  bake_frontend_images all-runtime
  echo "Local prod images tagged ${NESTLANCER_IMAGE_REGISTRY:-ghcr.io/nestlancer}/frontend-{web,admin,landing}:${NESTLANCER_IMAGE_TAG:-latest}"
  exit 0
fi

args=("$@")
if [ "${args[0]}" = "up" ]; then
  has_pull=0
  for a in "${args[@]}"; do
    if [ "$a" = "--pull" ]; then
      has_pull=1
      break
    fi
  done
  if [ "$has_pull" -eq 0 ]; then
    args=(up --pull never --no-build "${args[@]:1}")
  fi
fi

exec docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "${args[@]}"
