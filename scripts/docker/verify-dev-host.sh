#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

DEV_WEB_HOST="${DEV_WEB_HOST:-dev-app.nestlancer.com}"
DEV_ADMIN_HOST="${DEV_ADMIN_HOST:-dev-admin.nestlancer.com}"
DEV_LANDING_HOST="${DEV_LANDING_HOST:-dev-landing.nestlancer.com}"
DEV_API_HOST="${DEV_API_HOST:-dev-api.nestlancer.com}"

pass() { echo "PASS: $1"; }
warn() { echo "WARN: $1"; }
fail() { echo "FAIL: $1" >&2; exit 1; }

echo "Verifying frontend dev host routing"

if docker ps --format '{{.Names}}' | grep -q '^nl-frontend-dev-proxy$'; then
  pass "frontend dev proxy container is running"
  PROXY_MODE=frontend
elif docker ps --format '{{.Names}}' | grep -q '^nl-dev-proxy$'; then
  pass "backend dev proxy (nl-dev-proxy) is running — shared 80/443"
  PROXY_MODE=backend
else
  fail "no dev proxy running (start backend pnpm docker:up and/or frontend with proxy)"
fi

for c in nestlancer-frontend-web-dev nestlancer-frontend-admin-dev nestlancer-frontend-landing-dev; do
  if docker ps --format '{{.Names}}' | grep -q "^${c}$"; then
    pass "container ${c} is running"
  else
    fail "container ${c} is not running (pnpm docker:up in frontend repo)"
  fi
done

check_direct_port() {
  local port="$1"
  local name="$2"
  local code
  code="$(curl -sS -m 20 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/" || true)"
  if [[ "$code" == "200" ]]; then
    pass "direct port ${port} (${name}) returned 200"
  else
    fail "direct port ${port} (${name}) returned ${code:-000} (wait for Next compile)"
  fi
}

check_direct_port 9000 web
check_direct_port 9010 admin
check_direct_port 9020 landing

if [ "$PROXY_MODE" = "backend" ]; then
  for pair in "dev-web:nestlancer-frontend-web-dev:9000" "dev-admin:nestlancer-frontend-admin-dev:9010" "dev-landing:nestlancer-frontend-landing-dev:9020"; do
    label="${pair%%:*}"
    rest="${pair#*:}"
    host="${rest%%:*}"
    port="${rest##*:}"
    if docker exec nl-dev-proxy sh -c "wget -qO- -T 15 'http://${host}:${port}/' | grep -q '<!DOCTYPE'"; then
      pass "backend Caddy can reach ${label} upstream (${host}:${port})"
    else
      fail "backend Caddy cannot reach ${label} upstream (${host}:${port})"
    fi
  done
fi

API_IP="$(dig +short "$DEV_API_HOST" A 2>/dev/null | head -1 || true)"
WEB_IP="$(dig +short "$DEV_WEB_HOST" A 2>/dev/null | head -1 || true)"
VPS_IP="$(curl -4 -sS -m 5 ifconfig.me 2>/dev/null || true)"

if [ -n "$API_IP" ] && [ -n "$WEB_IP" ] && [ "$API_IP" != "$WEB_IP" ]; then
  warn "${DEV_WEB_HOST} -> ${WEB_IP} but ${DEV_API_HOST} -> ${API_IP}; align DNS A records to the same VPS IPv4"
elif [ -n "$VPS_IP" ] && [ -n "$WEB_IP" ] && [ "$WEB_IP" != "$VPS_IP" ]; then
  warn "${DEV_WEB_HOST} points to ${WEB_IP} but this host is ${VPS_IP}; update Cloudflare A records"
fi

check_public_https() {
  local host="$1"
  local headers
  headers="$(curl -sSI -m 20 "https://${host}/" 2>&1 || true)"
  if [[ "$headers" == *" 200 "* ]]; then
    pass "public HTTPS returned 200 for ${host}"
  elif [[ "$headers" == *"certificate"* ]] || [[ "$headers" == *"SSL"* ]]; then
    warn "public HTTPS cert issue for ${host} (DNS/IP mismatch or LE still provisioning)"
  else
    warn "public HTTPS is not 200 for ${host} yet"
  fi
}

check_public_https "$DEV_WEB_HOST"
check_public_https "$DEV_ADMIN_HOST"
check_public_https "$DEV_LANDING_HOST"

echo "Verification complete."
