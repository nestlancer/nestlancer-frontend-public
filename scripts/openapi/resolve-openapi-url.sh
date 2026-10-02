#!/usr/bin/env sh
# Resolve OpenAPI spec URL from env (no hardcoded dev host).
# Priority: OPENAPI_URL > OPENAPI_GATEWAY_URL/docs-all-json > API_UPSTREAM/docs-all-json > env file > NODE_ENV default
set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

load_dotenv() {
  file="$1"
  [ -f "$file" ] || return 0
  # shellcheck disable=SC1090
  set -a
  . "$file"
  set +a
}

if [ -n "${OPENAPI_URL:-}" ]; then
  printf '%s\n' "$OPENAPI_URL"
  exit 0
fi

if [ -n "${OPENAPI_GATEWAY_URL:-}" ]; then
  base="${OPENAPI_GATEWAY_URL%/}"
  printf '%s\n' "${base}/docs-all-json"
  exit 0
fi

if [ -n "${API_UPSTREAM:-}" ]; then
  base="${API_UPSTREAM%/}"
  printf '%s\n' "${base}/docs-all-json"
  exit 0
fi

env_name="${INFISICAL_ENV:-${NODE_ENV:-development}}"
case "$env_name" in
  production|prod)
    load_dotenv "${ROOT}/.env.production"
    if [ "${INFISICAL_ENV:-}" = "production" ] && [ -f "${ROOT}/.env.infisical" ]; then
      load_dotenv "${ROOT}/.env.infisical"
    fi
    ;;
  *)
    load_dotenv "${ROOT}/.env.development"
    if [ -f "${ROOT}/.env.infisical" ]; then
      load_dotenv "${ROOT}/.env.infisical"
    fi
    ;;
esac

if [ -n "${OPENAPI_URL:-}" ]; then
  printf '%s\n' "$OPENAPI_URL"
  exit 0
fi

if [ -n "${OPENAPI_GATEWAY_URL:-}" ]; then
  base="${OPENAPI_GATEWAY_URL%/}"
  printf '%s\n' "${base}/docs-all-json"
  exit 0
fi

if [ -n "${API_UPSTREAM:-}" ]; then
  base="${API_UPSTREAM%/}"
  printf '%s\n' "${base}/docs-all-json"
  exit 0
fi

case "$env_name" in
  production|prod) printf '%s\n' 'https://api.nestlancer.com/docs-all-json' ;;
  *) printf '%s\n' 'https://dev-api.nestlancer.com/docs-all-json' ;;
esac
