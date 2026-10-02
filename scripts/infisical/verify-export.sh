#!/usr/bin/env bash
# Verify Infisical machine identity can export secrets for nestlancer-frontend.
#
# Usage:
#   INFISICAL_CLIENT_ID=... INFISICAL_CLIENT_SECRET=... ./scripts/infisical/verify-export.sh dev
#   ./scripts/infisical/verify-export.sh prod   # requires prod access on the identity
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_SLUG="${1:-dev}"

if ! command -v infisical >/dev/null 2>&1; then
  echo "ERROR: infisical CLI not found" >&2
  exit 1
fi

if [ -z "${INFISICAL_TOKEN:-}" ]; then
  if [ -z "${INFISICAL_CLIENT_ID:-}" ] || [ -z "${INFISICAL_CLIENT_SECRET:-}" ]; then
    echo "ERROR: set INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET (or INFISICAL_TOKEN)" >&2
    exit 1
  fi
  export INFISICAL_TOKEN
  INFISICAL_TOKEN="$(infisical login \
    --method=universal-auth \
    --client-id="$INFISICAL_CLIENT_ID" \
    --client-secret="$INFISICAL_CLIENT_SECRET" \
    --silent --plain)"
fi

PROJECT_ID="${INFISICAL_PROJECT_ID:-}"
if [ -z "$PROJECT_ID" ] && [ -f .infisical.json ]; then
  PROJECT_ID="$(node -p "JSON.parse(require('fs').readFileSync('.infisical.json','utf8')).workspaceId")"
fi
if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: set INFISICAL_PROJECT_ID or commit .infisical.json" >&2
  exit 1
fi

echo "Exporting env=$ENV_SLUG projectId=$PROJECT_ID ..."
infisical export --env="$ENV_SLUG" --format=dotenv --projectId="$PROJECT_ID" | head -20
echo "OK — Infisical export succeeded for env=$ENV_SLUG"
