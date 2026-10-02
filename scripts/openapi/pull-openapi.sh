#!/usr/bin/env sh
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${ROOT}/swagger-docs/openapi-gateway.json"
RESOLVE="$(dirname "$0")/resolve-openapi-url.sh"

PRIMARY_URL="$("$RESOLVE")"
FALLBACK_URL="${OPENAPI_FALLBACK_URL:-http://127.0.0.1:3000/docs-all-json}"

fetch_spec() {
  curl -fsSL "$1" -o "$OUT"
}

echo "Fetching ${PRIMARY_URL} -> ${OUT}"
if fetch_spec "$PRIMARY_URL"; then
  :
elif [ -z "${OPENAPI_URL:-}" ] && [ "$PRIMARY_URL" != "$FALLBACK_URL" ]; then
  echo "Primary URL failed. Trying ${FALLBACK_URL} ..."
  fetch_spec "$FALLBACK_URL"
else
  echo "ERROR: Could not download OpenAPI spec." >&2
  echo "  - Start backend: cd nestlancer-backend-api && pnpm docker:up" >&2
  echo "  - Or set OPENAPI_URL / OPENAPI_GATEWAY_URL / API_UPSTREAM in .env.development" >&2
  echo "  - Local gateway: OPENAPI_URL=http://127.0.0.1:3000/docs-all-json pnpm pull:openapi" >&2
  exit 22
fi

node "$(dirname "$0")/normalize-openapi-document.mjs" "$OUT"
echo "Done."
