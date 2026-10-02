#!/usr/bin/env bash
# Post-deploy smoke: HTTP 200 on each frontend app root + referenced _next/static assets.
# Catches NL-BUG-DEPLOY-01/02/03 (HTML/manifest referencing missing chunks/CSS).

set -euo pipefail

if docker inspect nl-prod-frontend-web >/dev/null 2>&1; then
  WEB_URL="${WEB_URL:-http://127.0.0.1:9100/login}"
  ADMIN_URL="${ADMIN_URL:-http://127.0.0.1:9110/login}"
  LANDING_URL="${LANDING_URL:-http://127.0.0.1:9120/}"
else
  WEB_URL="${WEB_URL:-http://127.0.0.1:9000/login}"
  ADMIN_URL="${ADMIN_URL:-http://127.0.0.1:9010/login}"
  LANDING_URL="${LANDING_URL:-http://127.0.0.1:9020/}"
fi
MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-30}"
SLEEP_SECS="${SMOKE_SLEEP_SECS:-2}"

check_url() {
  local name="$1"
  local url="$2"
  local attempt=1
  until curl -sf -o /dev/null "$url"; do
    if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      echo "ERROR: ${name} (${url}) did not return 2xx after ${MAX_ATTEMPTS} attempts" >&2
      exit 1
    fi
    echo "  waiting for ${name} (${attempt}/${MAX_ATTEMPTS})..."
    sleep "$SLEEP_SECS"
    attempt=$((attempt + 1))
  done
  echo "  OK ${name}"
}

# Fail the deploy if any /_next/static/* referenced by the page HTML is not 200.
check_next_static() {
  local name="$1"
  local page_url="$2"
  local origin
  origin="$(echo "$page_url" | sed -E 's#(https?://[^/]+).*#\1#')"
  local html
  html="$(mktemp)"
  curl -sfL "$page_url" -o "$html" || {
    echo "ERROR: ${name}: could not fetch ${page_url}" >&2
    rm -f "$html"
    exit 1
  }
  local bad=0
  local asset
  while IFS= read -r asset; do
    [ -n "$asset" ] || continue
    # Strip trailing backslash artifacts from escaped HTML attributes.
    asset="${asset%\\}"
    local code
    code="$(curl -sS -o /dev/null -w '%{http_code}' "${origin}${asset}")"
    if [ "$code" != "200" ]; then
      echo "ERROR: ${name}: ${asset} → HTTP ${code}" >&2
      bad=$((bad + 1))
    fi
  done < <(grep -oE '/_next/static/[^"'\''[:space:]\\]+' "$html" | sort -u)
  rm -f "$html"
  if [ "$bad" -gt 0 ]; then
    echo "ERROR: ${name}: ${bad} missing _next/static asset(s) — HTML/manifest vs publish mismatch (NL-BUG-DEPLOY)" >&2
    exit 1
  fi
  echo "  OK ${name} _next/static assets"
}

echo "Frontend smoke checks (max ${MAX_ATTEMPTS} attempts each)"
check_url "web" "${WEB_URL%/}"
check_url "admin" "${ADMIN_URL%/}"
check_url "landing" "${LANDING_URL%/}/"
check_next_static "web" "${WEB_URL%/}"
check_next_static "admin" "${ADMIN_URL%/}"
echo "Smoke checks passed"
