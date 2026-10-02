#!/usr/bin/env bash
# Production Docker Compose helper (Infisical → .env.infisical).
#
# Usage:
#   INFISICAL_ENV=prod ./scripts/docker/compose-prod.sh up -d
#   ./scripts/docker/compose-prod.sh logs -f web

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
INFISICAL_ENV="${INFISICAL_ENV:-prod}"

if [ ! -f "$COMPOSE_FILE" ]; then
  node scripts/docker/generate-prod-compose.mjs
fi

# shellcheck source=ensure-infisical-env.sh
source "$ROOT/scripts/docker/ensure-infisical-env.sh"

needs_env_file() {
  case "${1:-}" in
    up | start | restart | run | create) return 0 ;;
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

if [ ! -f .env.infisical ]; then
  echo "WARN: .env.infisical missing — set SKIP_INFISICAL_EXPORT=1 if secrets are already present" >&2
fi

# Default: use images already on the VPS. Override with COMPOSE_PULL=always|missing.
args=("$@")
if [ "${#args[@]}" -gt 0 ] && [ "${args[0]}" = "up" ]; then
  pull_policy="${COMPOSE_PULL:-never}"
  has_pull=0
  for a in "${args[@]}"; do
    if [ "$a" = "--pull" ]; then
      has_pull=1
      break
    fi
  done
  if [ "$has_pull" -eq 0 ]; then
    args=(up --pull "$pull_policy" "${args[@]:1}")
  fi
fi

exec docker compose -f "$COMPOSE_FILE" "${args[@]}"
